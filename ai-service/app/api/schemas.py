from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RepoLoadRequest(BaseModel):
    repo_url: str = Field(..., description="GitHub repository URL")


class RepoLoadResponse(BaseModel):
    repo_id: str
    status: str = "success"
    file_count: int
    chunk_count: Optional[int] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class QueryRequest(BaseModel):
    query: str
    repo_id: str
    chat_history: List[Dict[str, Any]] = []


class SourceDocument(BaseModel):
    file_path: Optional[str] = None
    language: Optional[str] = None
    content: str
    chunk_id: Optional[int] = None
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    retrieval_metadata: Optional[Dict[str, Any]] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceDocument]
    provider: Optional[str] = None
    model: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    hybrid_search_enabled: bool
    llm_provider: str
    active_model: str


class ModelInfoResponse(BaseModel):
    active_provider: str
    active_model: str
    fallback_model: Optional[str]
    gemini_configured: bool
    groq_configured: bool
