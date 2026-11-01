"""
Centralized configuration for CareerMatch AI.
Loads environment variables from .env (if present) and defines safe defaults.
"""

import os

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except ImportError:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
DATABASE_PATH: str = os.environ.get("DATABASE_PATH", os.path.join(ROOT_DIR, "careermatch.db")).strip()
DATABASE_URL: str = os.environ.get("DATABASE_URL", "").strip()
MYSQL_HOST: str = os.environ.get("MYSQL_HOST", "").strip()
MYSQL_PORT: int = int(os.environ.get("MYSQL_PORT", "3306"))
MYSQL_USER: str = os.environ.get("MYSQL_USER", "").strip()
MYSQL_PASSWORD: str = os.environ.get("MYSQL_PASSWORD", "").strip()
MYSQL_DATABASE: str = os.environ.get("MYSQL_DATABASE", "careermatch_ai").strip()
JWT_SECRET: str = os.environ.get("JWT_SECRET", "careermatch-ai-2-dev-secret-key-change-in-prod").strip()
JWT_EXPIRY_HOURS: int = int(os.environ.get("JWT_EXPIRY_HOURS", "72"))
GITHUB_TOKEN: str = os.environ.get("GITHUB_TOKEN", "").strip()
PORT: int = int(os.environ.get("PORT", "3000"))

