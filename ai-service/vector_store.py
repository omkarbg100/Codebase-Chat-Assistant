import os
import chromadb
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

CHROMA_DB_DIR = "chroma_db"
# Only set CHROMA_HOST if explicitly provided in environment (e.g., in Docker)
CHROMA_HOST = os.getenv("CHROMA_HOST")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))

# 🔥 Load embedding model ONCE (performance optimization)
embedding_model = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

def get_embeddings():
    return embedding_model

def get_chroma_client():
    if CHROMA_HOST:
        return chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
    return None

def get_vector_store(repo_id: str = None):
    try:
        if not repo_id:
            return None

        client = get_chroma_client()
        
        # 1. Server mode (Docker)
        if client:
            try:
                client.get_collection(name=repo_id)
                print(f"📂 Loading existing vector DB collection from Chroma server for repo: {repo_id}")
                return Chroma(
                    client=client,
                    collection_name=repo_id,
                    embedding_function=get_embeddings()
                )
            except Exception:
                print("⚠️ No existing vector store collection found on Chroma server.")
                return None
        
        # 2. Local folder mode (Local Development)
        persist_dir = os.path.join(CHROMA_DB_DIR, repo_id)
        if os.path.exists(persist_dir):
            print(f"📂 Loading existing local vector DB for repo: {repo_id}")
            return Chroma(
                persist_directory=persist_dir,
                embedding_function=get_embeddings()
            )

        print("⚠️ No existing local vector store found.")
        return None

    except Exception as e:
        print(f"❌ Error loading vector store: {e}")
        raise e


def create_vector_store(chunks, repo_id: str):
    if not repo_id:
        raise ValueError("repo_id is required")

    texts = [c["page_content"] for c in chunks]
    metadatas = [c.get("metadata", {}) for c in chunks]

    print(f"🚀 Creating vector store for repo: {repo_id}")
    print(f"📊 Total chunks: {len(texts)}")

    client = get_chroma_client()
    persist_dir = os.path.join(CHROMA_DB_DIR, repo_id) if not client else None
    if persist_dir:
        os.makedirs(persist_dir, exist_ok=True)

    # 🔥 Batch processing (important for large repos)
    batch_size = 100
    vector_store = None

    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        batch_meta = metadatas[i:i+batch_size]

        print(f"⚡ Processing batch {i//batch_size + 1}")

        if vector_store is None:
            if client:
                vector_store = Chroma.from_texts(
                    texts=batch_texts,
                    embedding=get_embeddings(),
                    metadatas=batch_meta,
                    client=client,
                    collection_name=repo_id
                )
            else:
                vector_store = Chroma.from_texts(
                    texts=batch_texts,
                    embedding=get_embeddings(),
                    metadatas=batch_meta,
                    persist_directory=persist_dir
                )
        else:
            vector_store.add_texts(
                texts=batch_texts,
                metadatas=batch_meta
            )
    
    print("✅ Vector store created successfully!")
    return vector_store
