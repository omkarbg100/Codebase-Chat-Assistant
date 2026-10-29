import os
import sys
from dotenv import load_dotenv

# Ensure safe console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

load_dotenv()


class Settings:
    """Central configuration for AI Service."""

    # LLM Provider settings (LiteLLM)
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Active LLM provider: 'gemini' | 'groq' | 'ollama' | 'auto'
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama").lower()

    # Models supported via LiteLLM
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini/gemini-2.5-flash")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "groq/llama-3.3-70b-versatile")

    # Ollama local model settings (LiteLLM prefix: 'ollama/')
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "ollama/llama3.2")

    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

    # Vector store & Database settings
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "chroma_db")
    CHROMA_HOST: str = os.getenv("CHROMA_HOST", "")
    CHROMA_PORT: int = int(os.getenv("CHROMA_PORT", 8000))
    TEMP_REPOS_DIR: str = os.getenv("TEMP_REPOS_DIR", "temp_repos")

    # Hybrid search parameters
    HYBRID_SEARCH_ENABLED: bool = os.getenv("HYBRID_SEARCH_ENABLED", "true").lower() in ("true", "1", "yes")
    HYBRID_DENSE_WEIGHT: float = float(os.getenv("HYBRID_DENSE_WEIGHT", "0.5"))
    HYBRID_SPARSE_WEIGHT: float = float(os.getenv("HYBRID_SPARSE_WEIGHT", "0.5"))
    HYBRID_RRF_K: int = int(os.getenv("HYBRID_RRF_K", "60"))
    HYBRID_DENSE_K: int = int(os.getenv("HYBRID_DENSE_K", "10"))
    HYBRID_SPARSE_K: int = int(os.getenv("HYBRID_SPARSE_K", "10"))
    HYBRID_FINAL_K: int = int(os.getenv("HYBRID_FINAL_K", "5"))


settings = Settings()
