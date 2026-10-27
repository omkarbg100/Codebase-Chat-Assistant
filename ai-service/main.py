import sys
import uvicorn
from app.main import app

# updated
# Configure UTF-8 safe output for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8400,
        reload=True,
        reload_excludes=["temp_repos/*", "chroma_db/*"]
    )
