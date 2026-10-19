import logging
from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage, AIMessage

from app.api.schemas import (
    RepoLoadRequest,
    RepoLoadResponse,
    QueryRequest,
    QueryResponse,
    SourceDocument,
    HealthResponse,
    ModelInfoResponse,
)
from app.services.repo_loader import clone_repo, get_repo_files, cleanup_repo
from app.retrieval.chunker import chunk_code
from app.retrieval.vector_store import create_vector_store, get_vector_store
from app.retrieval.bm25_store import create_bm25_store
from app.retrieval.hybrid_retriever import get_hybrid_retriever
from app.core.rag_pipeline import get_rag_chain
from app.core.llm import get_llm
from app.config import settings

logger = logging.getLogger("api.routes")
router = APIRouter()


@router.post("/load-repo", response_model=RepoLoadResponse)
async def load_repo_endpoint(request: RepoLoadRequest):
    """Clones a GitHub repository, chunks its source code, and indexes both dense and sparse representations."""
    try:
        temp_dir, repo_id = clone_repo(request.repo_url)
        files_data = list(get_repo_files(temp_dir))
        if not files_data:
            cleanup_repo(temp_dir)
            raise HTTPException(status_code=400, detail="No source code files found.")

        chunks = chunk_code(files_data)
        
        # Concurrently index both dense (ChromaDB) and sparse (BM25Plus) representations
        create_vector_store(chunks, repo_id)
        create_bm25_store(chunks, repo_id)
        cleanup_repo(temp_dir)

        return RepoLoadResponse(
            repo_id=repo_id,
            status="success",
            file_count=len(files_data),
            chunk_count=len(chunks)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading repo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask", response_model=QueryResponse)
async def ask_endpoint(request: QueryRequest):
    """Answers user queries about an ingested codebase using Hybrid Retrieval and LiteLLM (Gemini / Groq)."""
    try:
        # 1. Setup Vector Store
        vector_store = get_vector_store(request.repo_id)
        if not vector_store:
            raise HTTPException(status_code=404, detail="Repo not found.")

        # 2. Setup Hybrid Retriever & LiteLLM RAG Chain
        hybrid_retriever = get_hybrid_retriever(request.repo_id, vector_store=vector_store)
        llm = get_llm()
        chain = get_rag_chain(hybrid_retriever, llm=llm)

        # 3. Format Conversation History
        formatted_history = []
        for msg in request.chat_history:
            if msg.get("role") == "user":
                formatted_history.append(HumanMessage(content=msg.get("content", "")))
            else:
                formatted_history.append(AIMessage(content=msg.get("content", "")))

        # 4. Retrieve candidate code chunks via Hybrid Retriever (Dense + BM25 with RRF)
        docs = hybrid_retriever.invoke(request.query)

        # 5. Generate Answer via LiteLLM
        answer = chain.invoke({
            "input": request.query,
            "chat_history": formatted_history
        })

        # 6. Format sources preserving metadata and line numbers
        sources: list[SourceDocument] = []
        for doc in docs:
            meta = doc.metadata or {}
            sources.append(SourceDocument(
                file_path=meta.get("file_path"),
                language=meta.get("language"),
                content=doc.page_content,
                chunk_id=meta.get("chunk_id"),
                start_line=meta.get("start_line"),
                end_line=meta.get("end_line"),
                retrieval_metadata=meta.get("retrieval_metadata")
            ))

        return QueryResponse(
            answer=answer,
            sources=sources,
            provider=settings.LLM_PROVIDER,
            model=llm.model
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint indicating service state and active model configuration."""
    llm = get_llm()
    return HealthResponse(
        status="healthy",
        service="Codebase Chat AI Service",
        hybrid_search_enabled=settings.HYBRID_SEARCH_ENABLED,
        llm_provider=settings.LLM_PROVIDER,
        active_model=llm.model
    )


@router.get("/models", response_model=ModelInfoResponse)
async def model_info():
    """Returns active LiteLLM model configuration, fallbacks, and provider status."""
    llm = get_llm()
    return ModelInfoResponse(
        active_provider=settings.LLM_PROVIDER,
        active_model=llm.model,
        fallback_model=llm.fallback_model,
        gemini_configured=bool(settings.GOOGLE_API_KEY),
        groq_configured=bool(settings.GROQ_API_KEY)
    )
