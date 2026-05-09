import os
# pyrefly: ignore [missing-import]
import chromadb
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

# Use chromadb container name as host when in docker network
CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", 8000))

# 🔥 Load embedding model ONCE (performance optimization)
embedding_model = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

def get_embeddings():
    return embedding_model

def get_chroma_client():
    return chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

def get_vector_store(repo_id: str = None):
    try:
        if not repo_id:
            return None

        client = get_chroma_client()
        
        try:
            # Try to fetch the collection. It throws an error if it doesn't exist
            client.get_collection(name=repo_id)
            print(f"📂 Loading existing vector DB collection for repo: {repo_id}")
            return Chroma(
                client=client,
                collection_name=repo_id,
                embedding_function=get_embeddings()
            )
        except Exception:
            print("⚠️ No existing vector store collection found.")
            return None

    except Exception as e:
        print(f"❌ Error loading vector store: {e}")
        raise e


def create_vector_store(chunks, repo_id: str):
    if not repo_id:
        raise ValueError("repo_id is required")

    texts = [c["page_content"] for c in chunks]
    metadatas = [c.get("metadata", {}) for c in chunks]

    print(f"🚀 Creating vector store collection for repo: {repo_id}")
    print(f"📊 Total chunks: {len(texts)}")

    client = get_chroma_client()

    # 🔥 Batch processing (important for large repos)
    batch_size = 100
    vector_store = None

    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        batch_meta = metadatas[i:i+batch_size]

        print(f"⚡ Processing batch {i//batch_size + 1}")

        if vector_store is None:
            vector_store = Chroma.from_texts(
                texts=batch_texts,
                embedding=get_embeddings(),
                metadatas=batch_meta,
                client=client,
                collection_name=repo_id
            )
        else:
            vector_store.add_texts(
                texts=batch_texts,
                metadatas=batch_meta
            )
    
    print("✅ Vector store created successfully!")

    return vector_store