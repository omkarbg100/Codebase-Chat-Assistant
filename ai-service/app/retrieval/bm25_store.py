import os
import re
import json
import logging
import threading
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Plus
from langchain_core.documents import Document
from app.config import settings

logger = logging.getLogger("retrieval.bm25")


def tokenize_code(text: str) -> List[str]:
    """Code-aware tokenizer for BM25 retrieval.
    
    Extracts identifiers, file paths, API routes, camelCase words,
    snake_case, kebab-case, dotted properties, and error tokens.
    """
    if not text:
        return []

    raw_tokens = re.findall(r"[a-zA-Z0-9_\.\-/]+", text)
    tokens: List[str] = []

    for raw in raw_tokens:
        clean = raw.strip(".-_/")
        if not clean:
            continue

        lower = clean.lower()
        tokens.append(lower)

        # Split camelCase and PascalCase
        camel_parts = re.findall(r"[A-Z]?[a-z0-9]+|[A-Z]+(?=[A-Z][a-z0-9]|\b)", clean)
        if len(camel_parts) > 1:
            for part in camel_parts:
                part_lower = part.lower()
                if part_lower and part_lower != lower:
                    tokens.append(part_lower)

        # Split snake_case, kebab-case, dots, and path slashes
        sub_parts = re.split(r"[_.\-/]+", clean)
        if len(sub_parts) > 1:
            for sp in sub_parts:
                sp_lower = sp.lower()
                if sp_lower and sp_lower != lower:
                    tokens.append(sp_lower)

    return tokens


class BM25Store:
    """Thread-safe BM25 index storage and retrieval for repository code chunks."""

    def __init__(self, repo_id: str, chunks: Optional[List[Dict[str, Any]]] = None, persist_dir: Optional[str] = None):
        self.repo_id = repo_id
        self.chunks: List[Dict[str, Any]] = chunks or []
        self.persist_dir = persist_dir or os.path.join(settings.CHROMA_DB_DIR, repo_id)
        self.bm25: Optional[BM25Plus] = None
        self.lock = threading.RLock()
        self._build_index()

    def _build_index(self):
        """Constructs BM25Plus model from chunks."""
        with self.lock:
            if not self.chunks:
                self.bm25 = None
                return

            tokenized_corpus = []
            for chunk in self.chunks:
                meta = chunk.get("metadata", {})
                content = chunk.get("page_content", "")
                file_path = meta.get("file_path", "")
                file_name = meta.get("file_name", "")
                searchable_text = f"{file_path} {file_name}\n{content}"
                tokenized_corpus.append(tokenize_code(searchable_text))

            if tokenized_corpus:
                self.bm25 = BM25Plus(tokenized_corpus)
            else:
                self.bm25 = None

    def search(self, query: str, top_k: int = 10) -> List[Document]:
        """Performs BM25 keyword search, returning LangChain Document objects.
        
        Only returns documents with score > 0.0 to prevent noise.
        """
        with self.lock:
            if self.bm25 is None or not self.chunks or not query or not query.strip():
                return []

            q_tokens = tokenize_code(query)
            if not q_tokens:
                return []

            scores = self.bm25.get_scores(q_tokens)
            scored_indices = [(idx, score) for idx, score in enumerate(scores) if score > 0.0]
            if not scored_indices:
                return []

            scored_indices.sort(key=lambda x: x[1], reverse=True)
            top_matches = scored_indices[:top_k]

            results = []
            for idx, score in top_matches:
                chunk = self.chunks[idx]
                meta = chunk.get("metadata", {}).copy()
                meta["sparse_score"] = float(score)
                results.append(Document(page_content=chunk.get("page_content", ""), metadata=meta))

            return results

    def save(self, persist_dir: Optional[str] = None) -> str:
        """Persists the BM25 index data to disk in JSON format."""
        with self.lock:
            target_dir = persist_dir or self.persist_dir
            self.persist_dir = target_dir
            os.makedirs(target_dir, exist_ok=True)
            index_file = os.path.join(target_dir, "bm25_index.json")

            data = {
                "repo_id": self.repo_id,
                "chunks": self.chunks
            }
            temp_file = f"{index_file}.tmp"
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            if os.path.exists(index_file):
                os.remove(index_file)
            os.rename(temp_file, index_file)
            logger.info(f"Saved BM25 index with {len(self.chunks)} chunks to {index_file}")
            return index_file

    @classmethod
    def load(cls, repo_id: str, persist_dir: Optional[str] = None) -> Optional["BM25Store"]:
        """Loads BM25Store from disk if index file exists."""
        target_dir = persist_dir or os.path.join(settings.CHROMA_DB_DIR, repo_id)
        index_file = os.path.join(target_dir, "bm25_index.json")
        if not os.path.exists(index_file):
            return None

        try:
            with open(index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            chunks = data.get("chunks", [])
            store = cls(repo_id=repo_id, chunks=chunks, persist_dir=target_dir)
            logger.info(f"Loaded BM25 index with {len(chunks)} chunks from {index_file}")
            return store
        except Exception as e:
            logger.error(f"Error loading BM25 index from {index_file}: {e}")
            return None

    def update_chunks(self, new_or_updated_chunks: List[Dict[str, Any]], deleted_file_paths: Optional[List[str]] = None):
        """Supports file additions, updates, and deletions in the BM25 index."""
        with self.lock:
            deleted_set = set(p.replace("\\", "/") for p in (deleted_file_paths or []))
            updated_paths = set(c.get("metadata", {}).get("file_path", "").replace("\\", "/") for c in new_or_updated_chunks)

            preserved_chunks = []
            for chunk in self.chunks:
                fpath = chunk.get("metadata", {}).get("file_path", "").replace("\\", "/")
                if fpath not in deleted_set and fpath not in updated_paths:
                    preserved_chunks.append(chunk)

            self.chunks = preserved_chunks + new_or_updated_chunks
            self._build_index()
            self.save()
            logger.info(f"Updated BM25 index for {self.repo_id}: now {len(self.chunks)} chunks total.")


# In-memory thread-safe cache
_bm25_cache: Dict[str, BM25Store] = {}
_cache_lock = threading.RLock()


def get_bm25_store(repo_id: str, vector_store: Any = None) -> Optional[BM25Store]:
    """Retrieves or auto-hydrates a BM25Store for a given repository ID."""
    if not repo_id:
        return None

    with _cache_lock:
        if repo_id in _bm25_cache:
            return _bm25_cache[repo_id]

        store = BM25Store.load(repo_id)
        if store is not None:
            _bm25_cache[repo_id] = store
            return store

        # Auto-hydrate from Chroma vector store if available
        if vector_store is None:
            try:
                from app.retrieval.vector_store import get_vector_store
                vector_store = get_vector_store(repo_id)
            except Exception as e:
                logger.warning(f"Could not load vector store for auto-hydration: {e}")

        if vector_store is not None:
            try:
                collection_data = vector_store.get()
                documents = collection_data.get("documents", [])
                metadatas = collection_data.get("metadatas", [])
                
                if documents:
                    logger.info(f"Auto-hydrating BM25 index for repo '{repo_id}' from {len(documents)} Chroma chunks...")
                    chunks = []
                    for i, (doc, meta) in enumerate(zip(documents, metadatas)):
                        chunks.append({
                            "page_content": doc,
                            "metadata": meta or {}
                        })
                    store = BM25Store(repo_id=repo_id, chunks=chunks)
                    store.save()
                    _bm25_cache[repo_id] = store
                    return store
            except Exception as e:
                logger.warning(f"Auto-hydration from vector store failed for {repo_id}: {e}")

        empty_store = BM25Store(repo_id=repo_id, chunks=[])
        _bm25_cache[repo_id] = empty_store
        return empty_store


def create_bm25_store(chunks: List[Dict[str, Any]], repo_id: str) -> BM25Store:
    """Builds, persists, and caches a BM25Store during repository ingestion."""
    with _cache_lock:
        store = BM25Store(repo_id=repo_id, chunks=chunks)
        store.save()
        _bm25_cache[repo_id] = store
        return store


def clear_bm25_cache(repo_id: Optional[str] = None):
    """Clears cache entry for a repository or the entire cache."""
    with _cache_lock:
        if repo_id:
            _bm25_cache.pop(repo_id, None)
        else:
            _bm25_cache.clear()
