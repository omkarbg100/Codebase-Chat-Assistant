from langchain_core.documents import Document
from app.retrieval.hybrid_retriever import reciprocal_rank_fusion



def test_rrf_basic_scoring():
    dense_docs = [
        Document(page_content="doc 1", metadata={"file_path": "a.py", "chunk_id": 0}),
        Document(page_content="doc 2", metadata={"file_path": "b.py", "chunk_id": 0}),
    ]
    sparse_docs = [
        Document(page_content="doc 2", metadata={"file_path": "b.py", "chunk_id": 0}),
        Document(page_content="doc 3", metadata={"file_path": "c.py", "chunk_id": 0}),
    ]

    # With k=60, w_dense=0.5, w_sparse=0.5:
    # doc 1: dense rank 1 -> 0.5 / (60 + 1) = 0.5 / 61 ≈ 0.008197
    # doc 2: dense rank 2 -> 0.5 / (60 + 2) = 0.5 / 62 ≈ 0.008065
    #        sparse rank 1 -> 0.5 / (60 + 1) = 0.5 / 61 ≈ 0.008197
    #        total for doc 2 ≈ 0.016261 (Winner!)
    # doc 3: sparse rank 2 -> 0.5 / (60 + 2) = 0.5 / 62 ≈ 0.008065

    fused = reciprocal_rank_fusion(dense_docs, sparse_docs, k=60, w_dense=0.5, w_sparse=0.5, top_k=5)

    assert len(fused) == 3
    # doc 2 should be ranked #1 because it matched both
    assert fused[0].metadata["file_path"] == "b.py"
    assert fused[0].metadata["retrieval_metadata"]["dense_rank"] == 2
    assert fused[0].metadata["retrieval_metadata"]["sparse_rank"] == 1
    assert "dense" in fused[0].metadata["retrieval_metadata"]["fused_from"]
    assert "sparse" in fused[0].metadata["retrieval_metadata"]["fused_from"]
    assert fused[0].metadata["retrieval_metadata"]["rrf_score"] > fused[1].metadata["retrieval_metadata"]["rrf_score"]


def test_rrf_weight_tuning():
    dense_docs = [
        Document(page_content="semantic match", metadata={"file_path": "semantic.py", "chunk_id": 0}),
    ]
    sparse_docs = [
        Document(page_content="keyword match", metadata={"file_path": "keyword.py", "chunk_id": 0}),
    ]

    # When sparse weight dominates
    fused_sparse_heavy = reciprocal_rank_fusion(
        dense_docs, sparse_docs, k=60, w_dense=0.1, w_sparse=0.9, top_k=2
    )
    assert fused_sparse_heavy[0].metadata["file_path"] == "keyword.py"

    # When dense weight dominates
    fused_dense_heavy = reciprocal_rank_fusion(
        dense_docs, sparse_docs, k=60, w_dense=0.9, w_sparse=0.1, top_k=2
    )
    assert fused_dense_heavy[0].metadata["file_path"] == "semantic.py"


def test_rrf_deduplication_preserves_metadata():
    dense_docs = [
        Document(
            page_content="code snippet",
            metadata={
                "file_path": "src/utils.js",
                "chunk_id": 2,
                "start_line": 25,
                "end_line": 40,
                "language": "js"
            }
        )
    ]
    sparse_docs = [
        Document(
            page_content="code snippet",
            metadata={
                "file_path": "src/utils.js",
                "chunk_id": 2,
                "sparse_score": 5.4,
                "language": "js"
            }
        )
    ]

    fused = reciprocal_rank_fusion(dense_docs, sparse_docs, top_k=5)
    assert len(fused) == 1
    meta = fused[0].metadata
    assert meta["file_path"] == "src/utils.js"
    assert meta["chunk_id"] == 2
    assert meta["start_line"] == 25
    assert meta["end_line"] == 40
    assert meta["language"] == "js"
    assert "rrf_score" in meta["retrieval_metadata"]


def test_rrf_top_k_truncation():
    dense = [Document(page_content=f"c{i}", metadata={"file_path": f"f{i}.py", "chunk_id": 0}) for i in range(10)]
    sparse = [Document(page_content=f"c{i+10}", metadata={"file_path": f"f{i+10}.py", "chunk_id": 0}) for i in range(10)]

    fused = reciprocal_rank_fusion(dense, sparse, top_k=3)
    assert len(fused) == 3
