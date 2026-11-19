"""
Vercel serverless function entrypoint for CareerMatch AI.
Delegates to root app.py so both custom vercel.json and zero-config /api routes work seamlessly.
"""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app import app, handler  # noqa: F401

__all__ = ["app", "handler"]
