from fastapi import FastAPI
from app.api.routes import router


def create_app() -> FastAPI:
    """Application factory for Codebase Chat AI Service."""
    application = FastAPI(
        title="Codebase Chat AI Service",
        description="FastAPI service for repository indexing and RAG using LiteLLM (Gemini & Groq) and Hybrid Search.",
        version="2.0.0"
    )

    # Mount API router
    application.include_router(router)

    return application


app = create_app()
