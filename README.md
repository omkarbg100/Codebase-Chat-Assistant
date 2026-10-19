<div align="center">

# 🧑‍💻 Codebase Chat Assistant

**Chat with any GitHub repository using AI.**  
Upload a repo, ask questions in plain English, and get context-aware answers with exact file and line references — powered by **Hybrid Search (Dense + BM25+ RRF)** and **LiteLLM (Gemini ↔ Groq Failover)**.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF6F61)](https://www.trychroma.com/)
[![LiteLLM](https://img.shields.io/badge/LiteLLM-Multi--Provider-orange)](https://github.com/BerriAI/litellm)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

</div>

---

## 📖 System Architecture

> 💡 **Looking for complete architecture documentation, sequence diagrams, and mathematical formulas?**  
> Check out the dedicated **[System Architecture Guide (`arch.md`)](arch.md)**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Hybrid Search (RRF)** | Combines **dense vector search** (ChromaDB + `all-MiniLM-L6-v2`) and **sparse keyword search** (`BM25Plus` with code-aware tokenization) via **Reciprocal Rank Fusion** |
| 🤖 **Multi-Provider LLM Gateway** | Unified LiteLLM gateway with **Google Gemini (`gemini-2.5-flash`)** as primary and **Groq Cloud (`llama-3.3-70b-versatile`)** as instant automatic failover |
| 🔗 **Repo Indexing** | Clones any public GitHub URL, intelligently chunks code with language-aware separators, and tracks exact line ranges |
| 📂 **File & Line-Level Citations** | Every answer cites exact source files, lines, and snippet previews with interactive side-drawer inspection |
| 💬 **Conversational Chat** | Multi-turn chat with contextual memory persisted in MongoDB |
| 🔄 **Self-Healing Vector DB** | Auto-recovery orchestrator in Express automatically detects missing indexes and re-indexes repositories on the fly |
| 🔐 **Authentication** | JWT-based user registration and login with protected API routes and repository isolation |
| 🐳 **Docker & CI/CD Ready** | Multi-container Docker Compose setup and GitHub Actions deployment pipeline |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────────┐
│                          Browser                          │
│                   http://localhost:3000                   │
└─────────────────────────────┬─────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  client (Nginx)   │  :3000 → :80
                    │   React 19 + Vite │
                    └─────────┬─────────┘
                              │  /api/*  (proxied)
                    ┌─────────▼─────────┐
                    │  server (Express) │  :5000
                    │  Node.js 20 + JWT │
                    └───────┬─────┬─────┘
                            │     │
              ┌─────────────▼──┐  │
              │  MongoDB Atlas │  │
              │  Users, Repos  │  │
              │  Chat History  │  │
              └────────────────┘  │
                                  │  POST /load-repo, POST /ask
                    ┌─────────────▼───────────────────────┐
                    │        ai-service (FastAPI)         │  :8400
                    │   Clean Architecture (app/ layout)  │
                    ├─────────────────────────────────────┤
                    │  • Language-Aware Chunker           │
                    │  • Hybrid Retriever (RRF Fusion)    │
                    │  • LiteLLM Multi-Provider Gateway   │
                    └─────────────┬───────────┬───────────┘
                                  │           │
                 ┌────────────────▼─┐       ┌─▼────────────────┐
                 │ ChromaDB (:8000) │       │ BM25Plus Store   │
                 │ Dense Embeddings │       │ In-Memory Cache  │
                 │ (all-MiniLM-L6)  │       │ & JSON on Disk   │
                 └──────────────────┘       └──────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  LLM Inference Gateway    │
                    │  Primary:  Google Gemini  │
                    │  Failover: Groq (LLaMA)   │
                    └───────────────────────────┘
```

### How a query flows

1. **User asks a question** in the React UI (`POST /api/chat/ask`).
2. **Server enriches request** with the last 5 turns of conversation history and forwards it to `ai-service` (`POST /ask`).
3. **Hybrid Search executes in parallel**:
   - **Dense Search**: Queries ChromaDB collection for top-10 semantic matches using `all-MiniLM-L6-v2`.
   - **Sparse Search**: Tokenizes the query using camelCase/snake_case aware tokenization and queries the `BM25Plus` index for top-10 keyword matches.
4. **Reciprocal Rank Fusion (RRF)**: Merges both ranked lists with equal weights ($w=0.5, k=60$), eliminates duplicates, assigns provenance metadata (`dense_rank`, `sparse_rank`, `rrf_score`), and selects the top $k=6$ context chunks.
5. **LiteLLM Generation**: Injects context into the LangChain LCEL prompt and queries Google Gemini (`gemini-2.5-flash`). If rate-limited (HTTP 429) or unreachable, it dynamically switches to Groq (`llama-3.3-70b-versatile`).
6. **Delivery**: The synthesized answer and structured source citations are saved to MongoDB and returned to the UI.

---

## 📁 Project Structure

```
Codebase Chat Assistant/
│
├── arch.md                     # Deep-dive system architecture specification
├── docker-compose.yml          # Multi-container orchestration (4 services)
├── .env.example                # Root environment variables template
│
├── client/                     # React 19 + Vite frontend
│   ├── src/
│   │   ├── pages/              # Home, Login, Dashboard
│   │   ├── components/         # ChatWindow, Sidebar, SourceViewer
│   │   ├── services/api.js     # Axios client with JWT interceptor
│   │   └── context/            # AuthContext state
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                     # Express.js 5 REST API gateway
│   ├── routes/                 # authRoutes, repoRoutes, chatRoutes
│   ├── controllers/            # authController, repoController, chatController
│   ├── models/                 # User.js, Repo.js, Chat.js (Mongoose)
│   ├── middleware/             # auth.js (JWT validation)
│   ├── config/db.js            # MongoDB Atlas connection
│   ├── Dockerfile
│   └── index.js
│
└── ai-service/                 # FastAPI AI microservice (Python 3.11)
    ├── main.py                 # Application bootstrap entrypoint
    ├── Dockerfile              # Container definition
    ├── requirements.txt        # Dependencies (FastAPI, LiteLLM, ChromaDB, etc.)
    │
    ├── app/                    # Modular application code
    │   ├── main.py             # FastAPI app factory, CORS, and lifespan
    │   ├── config.py           # Centralized configuration & settings
    │   ├── api/                # API layer
    │   │   ├── routes.py       # Endpoints: /load-repo, /ask, /health
    │   │   └── schemas.py      # Pydantic request & response models
    │   ├── core/               # LLM & RAG pipelines
    │   │   ├── llm.py          # ChatLiteLLM gateway with auto-failover
    │   │   └── rag_pipeline.py # LCEL prompt templates and RAG chain
    │   ├── retrieval/          # Hybrid search subsystem
    │   │   ├── bm25_store.py   # Code-aware tokenizer & thread-safe BM25Plus
    │   │   ├── chunker.py      # Language-aware splitter with line tracking
    │   │   ├── hybrid_retriever.py # Reciprocal Rank Fusion retriever
    │   │   └── vector_store.py # ChromaDB dense vector store manager
    │   └── services/           # Service layer
    │       └── repo_service.py # Repository cloning, filtering & indexing
    │
    └── tests/                  # Test suite
        ├── test_bm25_store.py
        ├── test_chunker.py
        ├── test_hybrid_retriever.py
        ├── test_litellm_core.py
        ├── test_rag_pipeline.py
        ├── test_vector_store.py
        └── test_eval_benchmark.py
```

---

## 🚀 Quick Start — Docker (Recommended)

> **Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Clone the repository

```bash
git clone https://github.com/omkarbg100/codebase-chat-assistant.git
cd "codebase-chat-assistant"
```

### 2. Configure secrets

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codebase_chat?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# Required: Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional: Groq API Key for blazing-fast inference and automatic failover
GROQ_API_KEY=your_groq_api_key_here

# Active LLM Provider: 'gemini' | 'groq' | 'auto'
LLM_PROVIDER=gemini
```

> - Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)
> - Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 3. Build and run

```bash
docker compose up --build
```

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Web UI (React SPA) |
| **Backend API** | http://localhost:5000 | Express REST API |
| **AI Service** | http://localhost:8400 | FastAPI AI Service |
| **API Docs (Swagger)** | http://localhost:8400/docs | Interactive OpenAPI documentation |
| **ChromaDB Server** | http://localhost:8000 | Standalone Vector DB container |

### Useful Docker commands

```bash
# Run in background
docker compose up --build -d

# View live logs for AI Service
docker compose logs -f ai-service

# Stop all services
docker compose down

# Stop and wipe database/vector volumes
docker compose down -v
```

---

## 💻 Local Development (No Docker)

### Terminal 1 — AI Service (FastAPI)

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Create ai-service/.env from template
cp .env.example .env

# Run FastAPI with hot-reloading
uvicorn main:app --reload --port 8400
# → http://localhost:8400
```

#### Run AI Service Test Suite
```bash
# Run all unit tests and retrieval evaluation benchmark
pytest -v tests/
```

### Terminal 2 — Backend Server (Express)

```bash
cd server
npm install

# Ensure server/.env contains PORT=5000, MONGODB_URI, JWT_SECRET, AI_SERVICE_URL=http://localhost:8400
cp .env.example .env

npm run dev
# → http://localhost:5000
```

### Terminal 3 — Frontend Client (React)

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### Root `.env` (Docker Compose)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB Atlas or local connection string |
| `JWT_SECRET` | Yes | — | Secret key for signing JSON Web Tokens |
| `GOOGLE_API_KEY` | Yes | — | Google Gemini API key |
| `GROQ_API_KEY` | No | — | Groq Cloud API key (for fast inference & failover) |
| `LLM_PROVIDER` | No | `gemini` | Active provider: `gemini`, `groq`, or `auto` |
| `GEMINI_MODEL` | No | `gemini/gemini-2.5-flash` | Gemini model routed via LiteLLM |
| `GROQ_MODEL` | No | `groq/llama-3.3-70b-versatile` | Groq model routed via LiteLLM |

### Hybrid Search Tuning Variables (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `HYBRID_DENSE_WEIGHT` | `0.5` | Weight factor for dense vector search in RRF |
| `HYBRID_SPARSE_WEIGHT` | `0.5` | Weight factor for BM25 sparse search in RRF |
| `HYBRID_RRF_K` | `60` | Rank smoothing constant $k$ in RRF formula |
| `RETRIEVER_K` | `6` | Total fused chunks passed to LLM context |

---

## 🌐 API Reference

### Auth Endpoints — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/register` | ❌ | Register new account (`username`, `email`, `password`) |
| `POST` | `/login` | ❌ | Authenticate and obtain JWT token |
| `GET` | `/me` | ✅ | Fetch current authenticated user profile |

### Repository Endpoints — `/api/repo`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/upload` | ✅ | Submit a GitHub URL to clone, chunk, and index |
| `GET` | `/list` | ✅ | List all repositories indexed by the user |

### Chat Endpoints — `/api/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/ask` | ✅ | Submit a question; triggers Hybrid RAG with citations |
| `GET` | `/history/:repoId` | ✅ | Retrieve conversation history for a repository |

### AI Microservice Endpoints — `:8400` (Internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/load-repo` | Clones repository, generates dense vectors & BM25 sparse index |
| `POST` | `/ask` | Performs hybrid retrieval, invokes LiteLLM, returns answer + citations |
| `GET` | `/health` | Service health check |

---

## 🧠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Axios, react-markdown, PrismJS |
| **Backend API** | Node.js 20, Express.js 5, Mongoose, JWT, bcryptjs |
| **Operational Database** | MongoDB Atlas / Local MongoDB |
| **AI Microservice** | Python 3.11, FastAPI, Uvicorn, LangChain (LCEL) |
| **Dense Search** | ChromaDB, HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| **Sparse Search** | `BM25Plus` ($\delta=1.0$) via `rank-bm25` with code-aware tokenization |
| **Rank Fusion** | Reciprocal Rank Fusion (RRF) with rank and score attribution |
| **LLM Gateway** | LiteLLM (`gemini/gemini-2.5-flash` primary, `groq/llama-3.3-70b-versatile` fallback) |
| **Containerization** | Docker, Docker Compose, Nginx (Alpine) |

---

## 🗂️ Docker Volumes

| Volume | Mount Target | Purpose |
|--------|--------------|---------|
| `ai_chroma_db` | `/chroma/chroma` | Persistent ChromaDB vector collections |
| `ai_bm25_indices` | `/app/chroma_db` | Persistent BM25 sparse JSON indices |
| `ai_temp_repos` | `/app/temp_repos` | Temporary clone scratch space during indexing |

---

## 🚀 CI/CD Pipeline (GitHub Actions)

A CI/CD pipeline is configured in `.github/workflows/deploy.yml`. On every push to `main`:
1. **Build Job**: Builds multi-tier Docker images (`client`, `server`, `ai-service`) and pushes tagged images to Docker Hub (`:latest` and `:<commit-sha>`).
2. **Deploy Job**: Connects via SSH to your host VM, writes the environment secrets, pulls the newly built images, and executes `docker compose up -d --remove-orphans`.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run the AI service test suite (`pytest -v tests/`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request
