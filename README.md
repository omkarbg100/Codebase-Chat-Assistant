# 🧑‍💻 Codebase Chat Assistant

An AI-powered application that allows developers to **chat with any GitHub repository** using natural language.
Built using **MERN + Python + GenAI**, this project uses **RAG (Retrieval-Augmented Generation)** to provide context-aware code explanations.

---

## 🚀 Features

* 🔗 Upload any GitHub repository
* 💬 Ask questions about the codebase
* 📂 Get file-level references
* 🧠 Context-aware answers using AI
* ⚡ Fast semantic search with vector database

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* Node.js (Express)
* MongoDB

### AI Engine

* Python (FastAPI)
* LangChain
* Gemini API
* ChromaDB

---

## ⚙️ How It Works

1. User uploads a GitHub repository
2. Code is split into chunks
3. Chunks are converted into embeddings
4. Stored in ChromaDB
5. User asks a question
6. Relevant code is retrieved
7. Gemini generates a contextual answer

---

## 📁 Project Structure

```
client/        # React frontend
server/        # Node.js backend
ai-service/    # Python AI service
```

---

## 🧠 Key Concepts

* Retrieval-Augmented Generation (RAG)
* Vector Databases
* Semantic Search
* LLM Integration

---

## 🚀 Getting Started

### 1. Clone the repo

```
git clone https://github.com/your-username/codebase-chat-assistant.git
cd codebase-chat-assistant
```

### 2. Setup Backend (Node.js)

```
cd server
npm install
npm start
```

### 3. Setup AI Service (Python)

```
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Setup Frontend

```
cd client
npm install
npm start
```

---

## 🔥 Future Improvements

* Code highlighting
* Multi-repo support
* Chat history
* Bug detection
* Auto documentation generator

---

## 📌 Use Cases

* Understand large codebases
* Developer onboarding
* Debugging assistance
* Code documentation

---

## ⭐ Contributing

Feel free to fork this repo and contribute!

---

