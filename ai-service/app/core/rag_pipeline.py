import os
from typing import Any, Optional
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from app.core.llm import get_llm
from app.config import settings


def format_docs(docs):
    """Formats retrieved Document chunks into a readable string for the prompt context."""
    if not docs:
        return "No relevant code snippets found in repository."
    
    formatted_chunks = []
    for doc in docs:
        meta = doc.metadata or {}
        file_path = meta.get("file_path", "unknown")
        start_line = meta.get("start_line")
        end_line = meta.get("end_line")
        line_info = f" (Lines {start_line}-{end_line})" if start_line and end_line else ""
        
        chunk_header = f"--- File: {file_path}{line_info} ---"
        formatted_chunks.append(f"{chunk_header}\n{doc.page_content}")
        
    return "\n\n".join(formatted_chunks)


def get_rag_chain(vector_store_or_retriever: Any, llm: Optional[Any] = None):
    """Creates a custom LCEL RAG chain using LiteLLM (Gemini / Groq).
    
    Accepts either a BaseRetriever (such as HybridRetriever) or a Chroma VectorStore.
    If no LLM is passed, it instantiates LiteLLM via get_llm().
    """
    active_llm = llm or get_llm()

    # Support either a retriever or a vector_store instance
    if hasattr(vector_store_or_retriever, "invoke") and not hasattr(vector_store_or_retriever, "as_retriever"):
        retriever = vector_store_or_retriever
    else:
        retriever = vector_store_or_retriever.as_retriever(search_kwargs={"k": settings.HYBRID_FINAL_K})

    system_prompt = (
        "You are an expert software engineer assistant. Help users understand a codebase using the code snippets below.\n\n"
        "Instructions:\n"
        "1. Use provided context to answer accurately.\n"
        "2. State clearly if information is missing.\n"
        "3. Reference file names and include snippets if helpful.\n\n"
        "Context:\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])

    chain = (
        RunnablePassthrough.assign(
            context=lambda x: format_docs(retriever.invoke(x["input"]))
        )
        | prompt
        | active_llm
        | StrOutputParser()
    )

    return chain
