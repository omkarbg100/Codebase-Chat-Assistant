import pytest
from unittest.mock import MagicMock
from langchain_core.documents import Document
from app.retrieval.hybrid_retriever import HybridRetriever, get_hybrid_retriever
from app.retrieval.bm25_store import BM25Store, clear_bm25_cache



@pytest.fixture(autouse=True)
def clean_cache():
    clear_bm25_cache()
    yield
    clear_bm25_cache()


def test_hybrid_retriever_invoke_both_sources():
    # Mock vector store
    mock_vs = MagicMock()
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        Document(page_content="vector doc 1", metadata={"file_path": "vec1.py", "chunk_id": 0}),
        Document(page_content="shared doc", metadata={"file_path": "shared.py", "chunk_id": 0}),
    ]
    mock_vs.as_retriever.return_value = mock_retriever

    # BM25 store
    chunks = [
        {"page_content": "bm25 doc 1", "metadata": {"file_path": "bm1.py", "chunk_id": 0}},
        {"page_content": "shared doc", "metadata": {"file_path": "shared.py", "chunk_id": 0}},
    ]
    bm25_store = BM25Store(repo_id="test-repo", chunks=chunks)

    retriever = HybridRetriever(
        repo_id="test-repo",
        vector_store=mock_vs,
        bm25_store=bm25_store,
        dense_k=5,
        sparse_k=5,
        final_k=3
    )

    results = retriever.invoke("shared doc")
    assert len(results) <= 3
    # Shared doc should be ranked top due to fusion
    assert results[0].metadata["file_path"] == "shared.py"
    assert "rrf_score" in results[0].metadata["retrieval_metadata"]


def test_repository_isolation():
    """Ensure two distinct repositories do not mix chunks."""
    chunks_a = [
        {"page_content": "def repo_a_secret(): return 'alpha'", "metadata": {"file_path": "a.py", "chunk_id": 0}}
    ]
    chunks_b = [
        {"page_content": "def repo_b_secret(): return 'beta'", "metadata": {"file_path": "b.py", "chunk_id": 0}}
    ]

    store_a = BM25Store(repo_id="repo-aaa", chunks=chunks_a)
    store_b = BM25Store(repo_id="repo-bbb", chunks=chunks_b)

    retriever_a = HybridRetriever(repo_id="repo-aaa", vector_store=None, bm25_store=store_a)
    retriever_b = HybridRetriever(repo_id="repo-bbb", vector_store=None, bm25_store=store_b)

    results_a = retriever_a.invoke("secret")
    assert len(results_a) == 1
    assert "alpha" in results_a[0].page_content

    results_b = retriever_b.invoke("secret")
    assert len(results_b) == 1
    assert "beta" in results_b[0].page_content


def test_fallback_when_sparse_fails():
    mock_vs = MagicMock()
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        Document(page_content="dense result", metadata={"file_path": "dense.py", "chunk_id": 0})
    ]
    mock_vs.as_retriever.return_value = mock_retriever

    # Broken/empty BM25 store
    empty_bm25 = BM25Store(repo_id="empty-bm25", chunks=[])

    retriever = HybridRetriever(
        repo_id="test-fallback",
        vector_store=mock_vs,
        bm25_store=empty_bm25,
        final_k=2
    )

    results = retriever.invoke("query")
    assert len(results) == 1
    assert results[0].metadata["file_path"] == "dense.py"


def test_fallback_when_dense_fails():
    mock_vs = MagicMock()
    mock_retriever = MagicMock()
    mock_retriever.invoke.side_effect = RuntimeError("Chroma connection timeout")
    mock_vs.as_retriever.return_value = mock_retriever

    chunks = [
        {"page_content": "def fallback_func(): return True", "metadata": {"file_path": "fb.py", "chunk_id": 0}}
    ]
    bm25_store = BM25Store(repo_id="test-dense-fail", chunks=chunks)

    retriever = HybridRetriever(
        repo_id="test-dense-fail",
        vector_store=mock_vs,
        bm25_store=bm25_store,
        final_k=2
    )

    # Should not raise exception; should fall back to sparse results
    results = retriever.invoke("fallback_func")
    assert len(results) == 1
    assert results[0].metadata["file_path"] == "fb.py"


def test_hybrid_disabled_flag():
    mock_vs = MagicMock()
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [
        Document(page_content="dense only", metadata={"file_path": "dense.py", "chunk_id": 0})
    ]
    mock_vs.as_retriever.return_value = mock_retriever

    chunks = [
        {"page_content": "sparse only", "metadata": {"file_path": "sparse.py", "chunk_id": 0}}
    ]
    bm25_store = BM25Store(repo_id="test-disabled", chunks=chunks)

    retriever = HybridRetriever(
        repo_id="test-disabled",
        vector_store=mock_vs,
        bm25_store=bm25_store,
        hybrid_enabled=False
    )

    results = retriever.invoke("sparse only")
    # BM25 is bypassed completely when hybrid_enabled=False
    assert len(results) == 1
    assert results[0].metadata["file_path"] == "dense.py"
