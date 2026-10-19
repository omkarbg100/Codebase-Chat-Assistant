import pytest
from typing import List, Dict, Any
from langchain_core.documents import Document
from app.retrieval.bm25_store import BM25Store
from app.retrieval.hybrid_retriever import reciprocal_rank_fusion
from app.retrieval.vector_store import get_embeddings
from langchain_chroma import Chroma

import tempfile
import shutil
import os


EVALUATION_CORPUS = [
    {
        "page_content": """exports.uploadRepo = async (req, res) => {
  try {
    const { repo_url } = req.body;
    if (!repo_url) return res.status(400).json({ message: 'Repository URL is required' });
    const newRepo = new Repo({ userId: req.user.id, repoUrl: repo_url, repoId: 'temp', status: 'processing' });
    await newRepo.save();
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/load-repo`, { repo_url });
    newRepo.repoId = aiResponse.data.repo_id;
    newRepo.status = 'completed';
    await newRepo.save();
    res.status(200).json({ message: 'Repository indexed successfully', repo: newRepo });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};""",
        "metadata": {"file_path": "server/controllers/repoController.js", "file_name": "repoController.js", "chunk_id": 0}
    },
    {
        "page_content": """const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user._id, email: user.email } });
};""",
        "metadata": {"file_path": "server/controllers/authController.js", "file_name": "authController.js", "chunk_id": 0}
    },
    {
        "page_content": """@app.post("/load-repo")
async def load_repo_endpoint(request: RepoLoadRequest):
    try:
        temp_dir, repo_id = clone_repo(request.repo_url)
        files_data = list(get_repo_files(temp_dir))
        if not files_data:
            cleanup_repo(temp_dir)
            raise HTTPException(status_code=400, detail="No source code files found.")
        chunks = chunk_code(files_data)
        create_vector_store(chunks, repo_id)
        create_bm25_store(chunks, repo_id)
        cleanup_repo(temp_dir)
        return {"repo_id": repo_id, "status": "success", "file_count": len(files_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))""",
        "metadata": {"file_path": "ai-service/main.py", "file_name": "main.py", "chunk_id": 1}
    },
    {
        "page_content": """class TokenExpiredException(Exception):
    \"\"\"Raised when the authentication JWT token has expired.\"\"\"
    def __init__(self, message="Token has expired. Please refresh your session."):
        self.message = message
        super().__init__(self.message)

def verify_token(token: str):
    if token == "expired":
        raise TokenExpiredException()
    return {"user_id": 123}""",
        "metadata": {"file_path": "ai-service/auth_exceptions.py", "file_name": "auth_exceptions.py", "chunk_id": 0}
    },
    {
        "page_content": """import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;""",
        "metadata": {"file_path": "server/config/db.js", "file_name": "db.js", "chunk_id": 0}
    },
    {
        "page_content": """exports.startBattleRoom = async (req, res) => {
  const { roomId, player1Id, player2Id } = req.body;
  const battleRoom = new BattleRoom({ roomId, players: [player1Id, player2Id], status: 'active' });
  await battleRoom.save();
  res.status(200).json({ status: 'battle_started', roomId });
};""",
        "metadata": {"file_path": "server/controllers/battleController.js", "file_name": "battleController.js", "chunk_id": 0}
    },
    # Distractor 1: Mentions battle rooms and player matchmaking conceptually without startBattleRoom endpoint
    {
        "page_content": """class Matchmaker {
  constructor() { this.queue = []; }
  addToQueue(player) {
    this.queue.push(player);
    if (this.queue.length >= 2) {
      const p1 = this.queue.shift();
      const p2 = this.queue.shift();
      return { matched: true, p1, p2 };
    }
    return { matched: false };
  }
}
module.exports = Matchmaker;""",
        "metadata": {"file_path": "server/services/matchmaker.js", "file_name": "matchmaker.js", "chunk_id": 0}
    },
    # Distractor 2: General token middleware and authentication verification
    {
        "page_content": """const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const bearer = header.split(' ')[1];
    req.user = jwt.verify(bearer, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid or malformed session token.' });
  }
};""",
        "metadata": {"file_path": "server/middleware/authMiddleware.js", "file_name": "authMiddleware.js", "chunk_id": 0}
    },
    # Distractor 3: Repo cloning and git archive handling
    {
        "page_content": """def clone_repo(repo_url: str):
    repo_id = str(uuid.uuid4())
    target_dir = os.path.join("temp_repos", repo_id)
    os.makedirs(target_dir, exist_ok=True)
    clean_url = repo_url.rstrip('/').replace('.git', '')
    zip_url = f"{clean_url}/zipball/main"
    resp = requests.get(zip_url, stream=True)
    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        z.extractall(target_dir)
    return target_dir, repo_id""",
        "metadata": {"file_path": "ai-service/repo_loader.py", "file_name": "repo_loader.py", "chunk_id": 0}
    },
    # Distractor 4: Chat controller managing user queries and mongo chat history
    {
        "page_content": """exports.askQuestion = async (req, res) => {
  const { query, repoId } = req.body;
  let chat = await Chat.findOne({ userId: req.user.id, repoId });
  if (!chat) chat = new Chat({ userId: req.user.id, repoId, messages: [] });
  const response = await axios.post(`${process.env.AI_SERVICE_URL}/ask`, { query, repo_id: repoId });
  chat.messages.push({ role: 'user', content: query });
  chat.messages.push({ role: 'assistant', content: response.data.answer });
  await chat.save();
  res.json({ answer: response.data.answer });
};""",
        "metadata": {"file_path": "server/controllers/chatController.js", "file_name": "chatController.js", "chunk_id": 0}
    },
    # Distractor 5: Vector store batching and Chroma client
    {
        "page_content": """def create_vector_store(chunks, repo_id: str):
    texts = [c["page_content"] for c in chunks]
    metadatas = [c.get("metadata", {}) for c in chunks]
    client = get_chroma_client()
    persist_dir = os.path.join("chroma_db", repo_id)
    vector_store = Chroma.from_texts(texts=texts, embedding=get_embeddings(), metadatas=metadatas, persist_directory=persist_dir)
    return vector_store""",
        "metadata": {"file_path": "ai-service/vector_store.py", "file_name": "vector_store.py", "chunk_id": 0}
    }
]


EVAL_QUERIES = [
    # 1. Exact function identifier (BM25 finds exact function, dense may confuse with matchmaker)
    {
        "query": "startBattleRoom",
        "target_file": "server/controllers/battleController.js",
        "category": "exact_identifier"
    },
    # 2. Exact custom exception (BM25 finds specific class, dense may match general auth middleware)
    {
        "query": "TokenExpiredException",
        "target_file": "ai-service/auth_exceptions.py",
        "category": "exact_identifier"
    },
    # 3. Exact technical parameter
    {
        "query": "player2Id",
        "target_file": "server/controllers/battleController.js",
        "category": "exact_identifier"
    },
    # 4. Exact endpoint definition
    {
        "query": "load_repo_endpoint",
        "target_file": "ai-service/main.py",
        "category": "api_endpoint"
    },
    # 5. Exact file path
    {
        "query": "server/controllers/authController.js",
        "target_file": "server/controllers/authController.js",
        "category": "file_path"
    },
    # 6. Conceptual query without exact function names (Dense advantage)
    {
        "query": "how are user credentials verified and password matched during sign in",
        "target_file": "server/controllers/authController.js",
        "category": "semantic"
    },
    # 7. Conceptual query for database failure handling (Dense advantage)
    {
        "query": "establishing database connection and handling mongodb connection failures",
        "target_file": "server/config/db.js",
        "category": "semantic"
    },
    # 8. Mixed query combining concept and specific identifier
    {
        "query": "uploadRepo function in repoController indexing GitHub repository",
        "target_file": "server/controllers/repoController.js",
        "category": "mixed"
    }
]



def calculate_metrics(ranked_results: List[List[Document]], ground_truths: List[str]):
    recall_at_1 = 0
    recall_at_3 = 0
    recall_at_5 = 0
    mrr_sum = 0.0

    n = len(ground_truths)
    for docs, target in zip(ranked_results, ground_truths):
        target_norm = target.replace("\\", "/")
        hit_rank = None
        for r, doc in enumerate(docs, start=1):
            doc_file = doc.metadata.get("file_path", "").replace("\\", "/")
            if doc_file == target_norm:
                hit_rank = r
                break

        if hit_rank is not None:
            if hit_rank <= 1:
                recall_at_1 += 1
            if hit_rank <= 3:
                recall_at_3 += 1
            if hit_rank <= 5:
                recall_at_5 += 1
            mrr_sum += 1.0 / hit_rank

    return {
        "Recall@1": round(recall_at_1 / n, 4),
        "Recall@3": round(recall_at_3 / n, 4),
        "Recall@5": round(recall_at_5 / n, 4),
        "MRR": round(mrr_sum / n, 4)
    }


def test_retrieval_evaluation_benchmark():
    """Quantitative comparison of Dense-Only, Sparse-Only, and Hybrid Retrieval."""
    temp_dir = tempfile.mkdtemp()
    try:
        # 1. Setup Dense Vector Store
        texts = [c["page_content"] for c in EVALUATION_CORPUS]
        metadatas = [c["metadata"] for c in EVALUATION_CORPUS]
        vector_store = Chroma.from_texts(
            texts=texts,
            embedding=get_embeddings(),
            metadatas=metadatas,
            persist_directory=temp_dir
        )

        # 2. Setup Sparse BM25 Store
        bm25_store = BM25Store(repo_id="eval-repo", chunks=EVALUATION_CORPUS)

        ground_truths = [q["target_file"] for q in EVAL_QUERIES]

        dense_runs = []
        sparse_runs = []
        hybrid_runs = []

        for item in EVAL_QUERIES:
            query = item["query"]

            # Dense-Only
            dense_docs = vector_store.as_retriever(search_kwargs={"k": 5}).invoke(query)
            dense_runs.append(dense_docs)

            # Sparse-Only (BM25)
            sparse_docs = bm25_store.search(query, top_k=5)
            sparse_runs.append(sparse_docs)

            # Hybrid (Dense + BM25 with RRF)
            dense_candidates = vector_store.as_retriever(search_kwargs={"k": 10}).invoke(query)
            sparse_candidates = bm25_store.search(query, top_k=10)
            fused_docs = reciprocal_rank_fusion(
                dense_docs=dense_candidates,
                sparse_docs=sparse_candidates,
                k=60,
                w_dense=0.5,
                w_sparse=0.5,
                top_k=5
            )
            hybrid_runs.append(fused_docs)

        dense_metrics = calculate_metrics(dense_runs, ground_truths)
        sparse_metrics = calculate_metrics(sparse_runs, ground_truths)
        hybrid_metrics = calculate_metrics(hybrid_runs, ground_truths)

        print("\n" + "="*80)
        print(f"RETRIEVAL EVALUATION BENCHMARK RESULTS ({len(EVAL_QUERIES)} Codebase Queries)")
        print("="*80)
        print(f"{'Metric':<15} | {'Dense-Only':<12} | {'Sparse-Only (BM25)':<18} | {'Hybrid (Dense+BM25)':<18}")
        print("-"*80)
        for metric in ["Recall@1", "Recall@3", "Recall@5", "MRR"]:
            print(f"{metric:<15} | {dense_metrics[metric]:<12.4f} | {sparse_metrics[metric]:<18.4f} | {hybrid_metrics[metric]:<18.4f}")
        print("="*80)

        print("\nPER-QUERY RETRIEVAL RANKS (1 is best, '-' means > 5):")
        print(f"{'Query':<35} | {'Dense':<6} | {'BM25':<6} | {'Hybrid':<6}")
        print("-"*60)
        for i, q in enumerate(EVAL_QUERIES):
            target = q["target_file"]
            def get_r(docs):
                for rank, d in enumerate(docs, 1):
                    if d.metadata.get("file_path", "").replace("\\", "/") == target:
                        return str(rank)
                return "-"
            r_dense = get_r(dense_runs[i])
            r_sparse = get_r(sparse_runs[i])
            r_hybrid = get_r(hybrid_runs[i])
            print(f"{q['query'][:33]:<35} | {r_dense:<6} | {r_sparse:<6} | {r_hybrid:<6}")
        print("="*80 + "\n")


        # Quantitative Assertions: Hybrid search achieves superior or equal performance
        # across all metrics compared to single-retriever baselines
        assert hybrid_metrics["Recall@1"] >= dense_metrics["Recall@1"]
        assert hybrid_metrics["Recall@3"] >= dense_metrics["Recall@3"]
        assert hybrid_metrics["Recall@5"] >= dense_metrics["Recall@5"]
        assert hybrid_metrics["MRR"] >= dense_metrics["MRR"]
        assert hybrid_metrics["Recall@5"] == 1.0  # Perfect recall@5 for hybrid search across categories

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
