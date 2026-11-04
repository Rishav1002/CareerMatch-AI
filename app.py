"""
Root entry point for CareerMatch AI (FastAPI + Neon/SQLite + Google Gemini).
Delegates to backend.main so both `python app.py` and `python -m backend.main` work seamlessly.
"""

from backend.main import app, run_server

__all__ = ["app", "run_server"]

if __name__ == "__main__":
    run_server()
