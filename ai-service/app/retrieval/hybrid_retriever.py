import logging
from typing import List, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from app.config import settings
from app.retrieval.bm25_store import get_bm25_store


logger = logging.getLogger("retrieval.hybrid")


def reciprocal_rank_fusion(
    dense_docs: List[Document],
    sparse_docs: List[Document],
    k: int = settings.HYBRID_RRF_K,
    w_dense: float = settings.HYBRID_DENSE_WEIGHT,
    w_sparse: float = settings.HYBRID_SPARSE_WEIGHT,
    top_k: int = settings.HYBRID_FINAL_K
) -> List[Document]:
    """Combines dense and sparse search results using Reciprocal Rank Fusion (RRF)."""
    scores: Dict[str, float] = {}
    doc_map: Dict[str, Document] = {}

    def get_chunk_key(doc: Document) -> str:
        meta = doc.metadata or {}
        file_path = str(meta.get("file_path", "")).replace("\\", "/")
        chunk_id = str(meta.get("chunk_id", ""))
        if file_path or chunk_id != "":
            return f"{file_path}::{chunk_id}"
        return doc.page_content[:100]

    # Process Dense ranks (1-indexed)
    for rank, doc in enumerate(dense_docs, start=1):
        key = get_chunk_key(doc)
        if key not in doc_map:
            doc_map[key] = Document(page_content=doc.page_content, metadata=doc.metadata.copy())
            doc_map[key].metadata.setdefault("retrieval_metadata", {})

        doc_map[key].metadata["retrieval_metadata"]["dense_rank"] = rank
        doc_map[key].metadata["retrieval_metadata"].setdefault("fused_from", []).append("dense")
        scores[key] = scores.get(key, 0.0) + (w_dense / (k + rank))

    # Process Sparse ranks (1-indexed)
    for rank, doc in enumerate(sparse_docs, start=1):
        key = get_chunk_key(doc)
        if key not in doc_map:
            doc_map[key] = Document(page_content=doc.page_content, metadata=doc.metadata.copy())
            doc_map[key].metadata.setdefault("retrieval_metadata", {})

        doc_map[key].metadata["retrieval_metadata"]["sparse_rank"] = rank
        doc_map[key].metadata["retrieval_metadata"].setdefault("fused_from", []).append("sparse")
        scores[key] = scores.get(key, 0.0) + (w_sparse / (k + rank))

    # Sort descending by fused RRF score
    sorted_keys = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

    results: List[Document] = []
    for key in sorted_keys[:top_k]:
        doc = doc_map[key]
        doc.metadata["retrieval_metadata"]["rrf_score"] = round(scores[key], 6)
        results.append(doc)

    return results


class HybridRetriever(BaseRetriever):
    """LangChain-compatible hybrid retriever combining dense vector search and BM25 sparse search."""

    repo_id: str
    vector_store: Any = None
    bm25_store: Optional[Any] = None
    dense_weight: float = settings.HYBRID_DENSE_WEIGHT
    sparse_weight: float = settings.HYBRID_SPARSE_WEIGHT
    dense_k: int = settings.HYBRID_DENSE_K
    sparse_k: int = settings.HYBRID_SPARSE_K
    final_k: int = settings.HYBRID_FINAL_K
    rrf_k: int = settings.HYBRID_RRF_K
    hybrid_enabled: bool = settings.HYBRID_SEARCH_ENABLED

    def _get_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        """Retrieves and fuses candidates from dense and sparse retrievers."""
        if not query or not query.strip():
            return []

        # If hybrid is disabled, fall back to dense-only
        if not self.hybrid_enabled:
            if self.vector_store is not None:
                try:
                    return self.vector_store.as_retriever(search_kwargs={"k": self.final_k}).invoke(query)
                except Exception as e:
                    logger.error(f"Dense-only retrieval failed: {e}")
                    return []
            return []

        # 1. Retrieve Dense Candidates
        dense_docs: List[Document] = []
        if self.vector_store is not None:
            try:
                retriever = self.vector_store.as_retriever(search_kwargs={"k": self.dense_k})
                dense_docs = retriever.invoke(query)
            except Exception as e:
                logger.warning(f"Dense vector retrieval encountered error for repo '{self.repo_id}': {e}")

        # 2. Retrieve Sparse Candidates
        sparse_docs: List[Document] = []
        if self.bm25_store is not None:
            try:
                sparse_docs = self.bm25_store.search(query, top_k=self.sparse_k)
            except Exception as e:
                logger.warning(f"Sparse BM25 retrieval encountered error for repo '{self.repo_id}': {e}")

        # 3. Handle Edge Cases and Fallbacks
        if not dense_docs and not sparse_docs:
            logger.info(f"No documents found for query '{query}' in repo '{self.repo_id}'")
            return []

        if not sparse_docs:
            logger.info("BM25 returned no matches; falling back to dense results.")
            return dense_docs[:self.final_k]

        if not dense_docs:
            logger.info("Dense retriever returned no matches; falling back to sparse BM25 results.")
            return sparse_docs[:self.final_k]

        # 4. Reciprocal Rank Fusion
        fused = reciprocal_rank_fusion(
            dense_docs=dense_docs,
            sparse_docs=sparse_docs,
            k=self.rrf_k,
            w_dense=self.dense_weight,
            w_sparse=self.sparse_weight,
            top_k=self.final_k
        )
        return fused


def get_hybrid_retriever(
    repo_id: str,
    vector_store: Any = None,
    dense_weight: Optional[float] = None,
    sparse_weight: Optional[float] = None,
    dense_k: Optional[int] = None,
    sparse_k: Optional[int] = None,
    final_k: Optional[int] = None,
    rrf_k: Optional[int] = None,
    hybrid_enabled: Optional[bool] = None,
) -> HybridRetriever:
    """Factory helper to construct and return a configured HybridRetriever."""
    if not repo_id:
        raise ValueError("repo_id is required to create a HybridRetriever.")

    bm25_store = get_bm25_store(repo_id, vector_store=vector_store)

    return HybridRetriever(
        repo_id=repo_id,
        vector_store=vector_store,
        bm25_store=bm25_store,
        dense_weight=dense_weight if dense_weight is not None else settings.HYBRID_DENSE_WEIGHT,
        sparse_weight=sparse_weight if sparse_weight is not None else settings.HYBRID_SPARSE_WEIGHT,
        dense_k=dense_k if dense_k is not None else settings.HYBRID_DENSE_K,
        sparse_k=sparse_k if sparse_k is not None else settings.HYBRID_SPARSE_K,
        final_k=final_k if final_k is not None else settings.HYBRID_FINAL_K,
        rrf_k=rrf_k if rrf_k is not None else settings.HYBRID_RRF_K,
        hybrid_enabled=hybrid_enabled if hybrid_enabled is not None else settings.HYBRID_SEARCH_ENABLED,
    )
