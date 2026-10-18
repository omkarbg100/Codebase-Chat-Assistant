@echo off
uvicorn main:app --reload --reload-exclude "temp_repos/*" --reload-exclude "chroma_db/*" --port 8400
