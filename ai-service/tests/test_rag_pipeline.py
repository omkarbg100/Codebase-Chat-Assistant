import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from langchain_core.documents import Document
from app.main import app
from app.retrieval.bm25_store import BM25Store
from app.retrieval.hybrid_retriever import HybridRetriever



client = TestClient(app)


def test_ask_endpoint_contract_and_sources():
    """Verify /ask endpoint calls hybrid retriever and returns answer + sources in expected format."""
    mock_vector_store = MagicMock()
    mock_hybrid_retriever = MagicMock()
    mock_hybrid_retriever.invoke.return_value = [
        Document(
            page_content="def hello(): return 'world'",
            metadata={
                "file_path": "src/hello.py",
                "language": "py",
                "chunk_id": 0,
                "start_line": 1,
                "end_line": 2,
                "retrieval_metadata": {"rrf_score": 0.016393, "dense_rank": 1, "sparse_rank": 1}
            }
        )
    ]

    mock_chain = MagicMock()
    mock_chain.invoke.return_value = "This is a helpful answer about hello()."

    with patch("app.api.routes.get_vector_store", return_value=mock_vector_store), \
         patch("app.api.routes.get_hybrid_retriever", return_value=mock_hybrid_retriever), \
         patch("app.api.routes.get_rag_chain", return_value=mock_chain):

        response = client.post("/ask", json={
            "query": "explain hello function",
            "repo_id": "test-repo-123",
            "chat_history": [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
        })

        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert data["answer"] == "This is a helpful answer about hello()."
        assert "sources" in data
        assert len(data["sources"]) == 1
        source = data["sources"][0]
        assert source["file_path"] == "src/hello.py"
        assert source["language"] == "py"
        assert source["content"] == "def hello(): return 'world'"
        assert source["chunk_id"] == 0
        assert source["start_line"] == 1
        assert source["end_line"] == 2
        assert "retrieval_metadata" in source


def test_ask_repo_not_found():
    with patch("app.api.routes.get_vector_store", return_value=None):
        response = client.post("/ask", json={
            "query": "test query",
            "repo_id": "nonexistent-repo-id",
            "chat_history": []
        })
        assert response.status_code == 404
        assert "Repo not found" in response.json()["detail"]


def test_load_repo_endpoint_creates_both_stores():
    mock_files = [
        {"content": "def main(): pass", "metadata": {"file_path": "main.py", "file_name": "main.py", "language": "py"}}
    ]

    with patch("app.api.routes.clone_repo", return_value=("/tmp/fake_dir", "new-repo-id")), \
         patch("app.api.routes.get_repo_files", return_value=mock_files), \
         patch("app.api.routes.create_vector_store") as mock_create_vec, \
         patch("app.api.routes.create_bm25_store") as mock_create_bm25, \
         patch("app.api.routes.cleanup_repo"):


        response = client.post("/load-repo", json={
            "repo_url": "https://github.com/example/repo"
        })

        assert response.status_code == 200
        data = response.json()
        assert data["repo_id"] == "new-repo-id"
        assert data["status"] == "success"
        assert data["file_count"] == 1
        assert data["chunk_count"] == 1

        mock_create_vec.assert_called_once()
        mock_create_bm25.assert_called_once()
