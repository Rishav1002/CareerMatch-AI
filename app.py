"""
Root entry point for CareerMatch AI (FastAPI + Neon/SQLite + Google Gemini).
Delegates to backend.main so both `python app.py` and `python -m backend.main` work seamlessly.
Compatible with local execution and Vercel Serverless Functions.
"""

import os
import sys

# Ensure root directory is in sys.path for serverless environments (Vercel / AWS Lambda)
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app, run_server

# Vercel serverless ASGI handler compatibility
handler = app

__all__ = ["app", "handler", "run_server"]

if __name__ == "__main__":
    run_server()
