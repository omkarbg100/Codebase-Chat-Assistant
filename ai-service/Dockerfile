# ---- Base Stage ----
FROM python:3.11-slim AS base

# Install system dependencies needed by sentence-transformers and chromadb
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ---- Final Stage ----
FROM deps AS final

# Copy source code (exclude venv, __pycache__, temp dirs, chroma_db)
COPY chunker.py .
COPY main.py .
COPY rag_pipeline.py .
COPY repo_loader.py .
COPY vector_store.py .

# Directories that are created at runtime
RUN mkdir -p /app/chroma_db /app/temp_repos

EXPOSE 8400

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8400"]
