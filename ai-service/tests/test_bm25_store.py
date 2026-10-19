import os
import shutil
import tempfile
import threading
import pytest
from app.retrieval.bm25_store import BM25Store, clear_bm25_cache



@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d, ignore_errors=True)


def test_empty_corpus_no_zerodivision(temp_dir):
    """Empty corpus should initialize without ZeroDivisionError and return empty search."""
    store = BM25Store(repo_id="empty-repo", chunks=[])
    assert store.bm25 is None
    results = store.search("anything")
    assert results == []

    # Persistence of empty store
    path = store.save(persist_dir=temp_dir)
    loaded = BM25Store.load("empty-repo", persist_dir=temp_dir)
    assert loaded is not None
    assert loaded.search("anything") == []


def test_bm25_search_scoring_and_filtering(temp_dir):
    chunks = [
        {
            "page_content": "def authenticate_user(username, password):\n    return token",
            "metadata": {"file_path": "auth/service.py", "file_name": "service.py", "chunk_id": 0}
        },
        {
            "page_content": "class DatabaseConnection:\n    def connect(self): pass",
            "metadata": {"file_path": "db/connection.py", "file_name": "connection.py", "chunk_id": 0}
        },
        {
            "page_content": "const calculateTotal = (items) => items.reduce((a, b) => a + b, 0);",
            "metadata": {"file_path": "cart/calculator.js", "file_name": "calculator.js", "chunk_id": 0}
        }
    ]
    store = BM25Store(repo_id="repo-1", chunks=chunks)

    # Search exact function name
    results = store.search("authenticate_user", top_k=5)
    assert len(results) >= 1
    assert results[0].metadata["file_path"] == "auth/service.py"
    assert "sparse_score" in results[0].metadata
    assert results[0].metadata["sparse_score"] > 0

    # Search file path
    path_results = store.search("cart/calculator.js", top_k=5)
    assert len(path_results) >= 1
    assert path_results[0].metadata["file_path"] == "cart/calculator.js"

    # Search completely unrelated term: should return empty list (not pollute with random docs)
    unrelated_results = store.search("photosynthesis biology plant")
    assert unrelated_results == []


def test_bm25_persistence(temp_dir):
    chunks = [
        {
            "page_content": "def run_analysis(): pass",
            "metadata": {"file_path": "analysis.py", "file_name": "analysis.py", "chunk_id": 0}
        }
    ]
    store = BM25Store(repo_id="persist-repo", chunks=chunks)
    store.save(persist_dir=temp_dir)

    loaded = BM25Store.load("persist-repo", persist_dir=temp_dir)
    assert loaded is not None
    assert len(loaded.chunks) == 1
    results = loaded.search("run_analysis")
    assert len(results) == 1
    assert results[0].metadata["file_path"] == "analysis.py"


def test_bm25_incremental_updates(temp_dir):
    initial_chunks = [
        {
            "page_content": "function oldFeature() { return true; }",
            "metadata": {"file_path": "src/features.js", "chunk_id": 0}
        },
        {
            "page_content": "function preservedFeature() { return 42; }",
            "metadata": {"file_path": "src/preserved.js", "chunk_id": 0}
        }
    ]
    store = BM25Store(repo_id="update-repo", chunks=initial_chunks, persist_dir=temp_dir)

    # 1. Update features.js with new implementation
    updated_chunks = [
        {
            "page_content": "function newFeature() { return 'v2'; }",
            "metadata": {"file_path": "src/features.js", "chunk_id": 0}
        }
    ]
    store.update_chunks(new_or_updated_chunks=updated_chunks)

    results = store.search("newFeature")
    assert len(results) >= 1
    assert results[0].metadata["file_path"] == "src/features.js"
    assert len(store.search("old")) == 0
    assert len(store.search("preservedFeature")) >= 1


    # 2. Delete preserved.js
    store.update_chunks(new_or_updated_chunks=[], deleted_file_paths=["src/preserved.js"])
    assert len(store.search("preserved")) == 0
    assert len(store.search("newFeature")) >= 1




def test_bm25_concurrent_access():
    chunks = [
        {"page_content": f"function func_{i}() {{ return {i}; }}", "metadata": {"file_path": f"f_{i}.js", "chunk_id": 0}}
        for i in range(50)
    ]
    store = BM25Store(repo_id="concurrent-repo", chunks=chunks)

    errors = []

    def worker(idx):
        try:
            for _ in range(20):
                res = store.search(f"func_{idx}")
                assert len(res) >= 1
                assert res[0].metadata["file_path"] == f"f_{idx}.js"
                assert f"func_{idx}" in res[0].page_content
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=worker, args=(i % 50,)) for i in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert errors == []

