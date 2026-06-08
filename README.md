<div align="center">

# 🧑‍💻 Codebase Chat Assistant

**Chat with any GitHub repository using AI.**  
Upload a repo, ask questions in plain English, and get context-aware answers with direct file references — powered by RAG.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Repo Indexing** | Paste any public GitHub URL — the codebase is cloned, chunked, and embedded |
| 💬 **Conversational Chat** | Multi-turn chat with full history, per repository |
| 📂 **File-Level Sources** | Every answer links back to the exact source file and code snippet |
| 🧠 **RAG Pipeline** | Semantic retrieval via ChromaDB + Gemini LLM for grounded answers |
| 🔐 **Auth** | JWT-based register/login with protected routes |
| 🐳 **Docker Ready** | One command to spin up all three services |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              http://localhost:3000                      │
└────────────────────────┬────────────────────────────────┘
                         │
                ┌────────▼─────────┐
                │  client (Nginx)  │  :3000 → :80
                │   React + Vite   │
                └────────┬─────────┘
                         │  /api/*  (proxied)
                ┌────────▼─────────┐
                │  server (Express)│  :5000
                │  Node.js + JWT   │
                └──────┬──────┬───┘
                       │      │
          ┌────────────▼──┐  ┌▼──────────────────┐
          │  MongoDB Atlas│  │ ai-service (FastAPI)│  :8400
          │  Users, Repos │  │ LangChain + ChromaDB│
          │  Chat History │  │ Gemini Embeddings  │
          └───────────────┘  └────────────────────┘
```

### How a query flows

1. User pastes a GitHub URL → `POST /api/repo/upload`
2. Server calls ai-service `POST /load-repo`
3. ai-service clones repo → chunks code → creates ChromaDB vector store
4. User asks a question → `POST /api/chat/ask`
5. Server forwards to ai-service `POST /ask`
6. ai-service retrieves top-k relevant chunks → Gemini generates answer
7. Answer + source file references returned to the UI

---

## 📁 Project Structure

```
Codebase Chat Assistant/
│
├── docker-compose.yml          # Orchestrates all services
├── .env                        # Root secrets (gitignored)
├── .env.example                # Template — safe to commit
│
├── client/                     # React 19 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Landing page
│   │   │   ├── Login.jsx       # Register / Login
│   │   │   └── Dashboard.jsx   # Main app layout
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Repo list + upload
│   │   │   ├── ChatWindow.jsx  # Multi-turn chat UI
│   │   │   └── SourceViewer.jsx# Side-panel file viewer
│   │   ├── services/
│   │   │   └── api.js          # Axios client (auth, repo, chat)
│   │   └── context/
│   │       └── AuthContext.jsx # JWT auth state
│   ├── Dockerfile
│   ├── nginx.conf              # SPA routing + /api proxy
│   └── vite.config.js
│
├── server/                     # Express.js REST API
│   ├── routes/
│   │   ├── authRoutes.js       # POST /register, /login, GET /me
│   │   ├── repoRoutes.js       # POST /upload, GET /list
│   │   └── chatRoutes.js       # POST /ask, GET /history/:repoId
│   ├── controllers/
│   ├── models/
│   │   ├── User.js
│   │   ├── Repo.js
│   │   └── Chat.js
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── index.js
│   └── Dockerfile
│
└── ai-service/                 # Python FastAPI service
    ├── main.py                 # POST /load-repo, POST /ask
    ├── repo_loader.py          # Clone + read repo files
    ├── chunker.py              # Code chunking strategy
    ├── vector_store.py         # ChromaDB read/write
    ├── rag_pipeline.py         # LangChain LCEL RAG chain
    ├── requirements.txt
    └── Dockerfile
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
# Copy the template
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_API_KEY=your_gemini_api_key_here   # ← only this is required
```

> Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 3. Build and run

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **AI Service** | http://localhost:8400 |
| **API Docs (FastAPI)** | http://localhost:8400/docs |

### Useful Docker commands

```bash
# Run in background
docker compose up --build -d

# View logs for a specific service
docker compose logs -f ai-service

# Stop all services
docker compose down

# Stop and wipe vector DB volumes
docker compose down -v

# Rebuild a single service
docker compose up --build server
```

## 🚀 CI/CD Pipeline (GitHub Actions)

A minimal CI/CD pipeline lives in `.github/workflows/deploy.yml`. It runs on every push to `main` and performs two jobs:

- **Build** – builds Docker images for the client, server, and AI service and pushes them to Docker Hub with two tags: `:latest` and `:<commit‑sha>`.
- **Deploy** – SSHs into the target VM, writes a `.env` file from repository secrets, pulls the exact images for the new commit, and brings the stack up with `docker compose up -d --remove-orphans`.

The workflow expects the following GitHub secrets to be defined in your repository settings:

- `DOCKERHUB_USERNAME` – Docker Hub account name
- `DOCKERHUB_TOKEN` – Docker Hub access token
- `SSH_PRIVATE_KEY` – Private SSH key for the VM user
- `VM_HOST` – VM IP address
- `VM_USER` – SSH user (e.g., `root`)
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_API_KEY`

The CI/CD workflow does **not** run on pull‑request events for security – it only builds images. Deployment only happens on pushes to the `main` branch.

You can view the full workflow file at [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

---

---

## 💻 Local Development (No Docker)

Open three terminals:

**Terminal 1 — AI Service**
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt

# Create ai-service/.env
echo GOOGLE_API_KEY=your_key > .env

uvicorn main:app --reload --port 8400
# → http://localhost:8400
```

**Terminal 2 — Server**
```bash
cd server
npm install
# Ensure server/.env has PORT, MONGODB_URI, JWT_SECRET, AI_SERVICE_URL
npm run dev
# → http://localhost:5000
```

**Terminal 3 — Client**
```bash
cd client
npm install
# client/.env.local already sets VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
# → http://localhost:5173
```

> In local dev, `vite.config.js` proxies `/api/*` → `localhost:5000`  
> so the frontend URL is **http://localhost:5173**.

---

## 🔑 Environment Variables

### Root `.env` (docker-compose)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `GOOGLE_API_KEY` | Gemini API key (used by ai-service) |

### `server/.env` (local dev only)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express server port |
| `MONGODB_URI` | — | MongoDB connection string |
| `JWT_SECRET` | — | JWT signing secret |
| `AI_SERVICE_URL` | `http://localhost:8400` | ai-service base URL |
| `GOOGLE_API_KEY` | — | Gemini API key |

### `ai-service/.env` (local dev only)

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Gemini API key |

### `client/.env.local` (local dev only)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base URL for axios |

---

## 🌐 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ❌ | Register a new user |
| `POST` | `/login` | ❌ | Login, receive JWT |
| `GET` | `/me` | ✅ | Get current user |

### Repositories — `/api/repo`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/upload` | ✅ | Index a GitHub repo |
| `GET` | `/list` | ✅ | List user's repos |

### Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ask` | ✅ | Ask a question about a repo |
| `GET` | `/history/:repoId` | ✅ | Get chat history for a repo |

### AI Service — `localhost:8400` (internal)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/load-repo` | Clone repo, create vector store |
| `POST` | `/ask` | Query RAG chain, return answer + sources |

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, react-markdown |
| **Backend** | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| **Database** | MongoDB Atlas |
| **AI Service** | Python 3.11, FastAPI, LangChain (LCEL), ChromaDB |
| **Embeddings** | `all-MiniLM-L6-v2` via HuggingFace (local, no API cost) |
| **LLM** | Google Gemini (`gemini-2.0-flash` via `langchain-google-genai`) |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 🗂️ Docker Volume Persistence

| Volume | Mount | Purpose |
|--------|-------|---------|
| `ai_chroma_db` | `/app/chroma_db` | Vector embeddings (persisted across restarts) |
| `ai_temp_repos` | `/app/temp_repos` | Temp repo clones during indexing |

---

## 📌 Use Cases

- 🔍 Understand a large unfamiliar codebase quickly
- 🎓 Developer onboarding — ask "how does auth work?"
- 🐛 Debugging — "where is the payment logic handled?"
- 📝 Auto-documentation and code explanation
- 🔄 Code review assistance

---

## 🔮 Roadmap

- [ ] Private GitHub repo support (OAuth token)
- [ ] Streaming responses (SSE)
- [ ] Multi-repo comparison chat
- [ ] Bug detection mode
- [ ] Auto-generate documentation from codebase
- [ ] VS Code extension

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---
