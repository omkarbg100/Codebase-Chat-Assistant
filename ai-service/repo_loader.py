import os
import shutil
import uuid
import requests
import zipfile
import io

# Constants for filtering
IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '__pycache__', 'venv', '.next', '.vscode'}
ALLOWED_EXTENSIONS = {'.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.c', '.cpp', '.cs', '.html', '.css', '.md','.ipynb'}

def clone_repo(repo_url: str):
    """Downloads a GitHub repository as a ZIP and extracts it (Workaround for systems without Git)."""
    repo_id = str(uuid.uuid4())
    target_dir = os.path.join("temp_repos", repo_id)
    os.makedirs(target_dir, exist_ok=True)
    
    try:
        # Convert GitHub URL to ZIP URL
        # From: https://github.com/user/repo
        # To: https://github.com/user/repo/archive/refs/heads/main.zip
        # Better: https://github.com/user/repo/zipball/main
        
        # Strip trailing slashes and .git
        clean_url = repo_url.rstrip('/').replace('.git', '')
        # We try 'main' first, then 'master' if it fails
        branches = ['main', 'master']
        success = False
        
        for branch in branches:
            zip_url = f"{clean_url}/zipball/{branch}"
            response = requests.get(zip_url, stream=True)
            
            if response.status_code == 200:
                with zipfile.ZipFile(io.BytesIO(response.content)) as zip_ref:
                    zip_ref.extractall(target_dir)
                    success = True
                    break
        
        if not success:
            raise Exception("Failed to download repository. Ensure the URL is correct and the repository is public.")
            
        return target_dir, repo_id
        
    except Exception as e:
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
        raise Exception(f"Failed to ingest repository: {str(e)}")

def get_repo_files(repo_path: str):
    """Walks through the repository and yields file content with metadata."""
    for root, dirs, files in os.walk(repo_path):
        # In-place modification of dirs to prune ignored ones
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            file_ext = os.path.splitext(file)[1].lower()
            if file_ext in ALLOWED_EXTENSIONS:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo_path)
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if content.strip():
                            yield {
                                "content": content,
                                "metadata": {
                                    "file_path": rel_path,
                                    "file_name": file,
                                    "language": file_ext.replace('.', '')
                                }
                            }
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")

def cleanup_repo(repo_path: str):
    """Removes the cloned repository directory."""
    if os.path.exists(repo_path):
        shutil.rmtree(repo_path)
