from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import uvicorn
from repo_loader import clone_repo, get_repo_files, cleanup_repo
from chunker import chunk_code
from vector_store import create_vector_store, get_vector_store
from rag_pipeline import get_rag_chain
from langchain_core.messages import HumanMessage, AIMessage

app = FastAPI(title="Codebase Chat AI Service")

class RepoLoadRequest(BaseModel):
    repo_url: str

class QueryRequest(BaseModel):
    query: str
    repo_id: str
    chat_history: list = []

@app.post("/load-repo")
async def load_repo_endpoint(request: RepoLoadRequest):
    try:
        temp_dir, repo_id = clone_repo(request.repo_url)
        files_data = list(get_repo_files(temp_dir))
        if not files_data:
            cleanup_repo(temp_dir)
            raise HTTPException(status_code=400, detail="No source code files found.")
            
        chunks = chunk_code(files_data)
        create_vector_store(chunks, repo_id)
        cleanup_repo(temp_dir)
        
        return {"repo_id": repo_id, "status": "success", "file_count": len(files_data)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_endpoint(request: QueryRequest):
    try:
        # 1. Setup
        vector_store = get_vector_store(request.repo_id)
        if not vector_store:
            raise HTTPException(status_code=404, detail="Repo not found.")
            
        chain = get_rag_chain(vector_store)
        
        # 2. History
        formatted_history = []
        for msg in request.chat_history:
            if msg["role"] == "user":
                formatted_history.append(HumanMessage(content=msg["content"]))
            else:
                formatted_history.append(AIMessage(content=msg["content"]))
            
        # 3. Retrieve sources manually (Most reliable way)
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        docs = retriever.invoke(request.query)
        
        # 4. Generate Answer
        answer = chain.invoke({
            "input": request.query, 
            "chat_history": formatted_history
        })
        
        # 5. Format sources
        sources = []
        for doc in docs:
            sources.append({
                "file_path": doc.metadata.get("file_path"),
                "language": doc.metadata.get("language"),
                "content": doc.page_content
            })
            
        return {
            "answer": answer,
            "sources": sources
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8400)
