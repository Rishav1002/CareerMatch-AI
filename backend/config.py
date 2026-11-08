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

APP_ENV: str = os.environ.get("APP_ENV", "development").strip().lower()

GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip() or "gemini-2.0-flash"
DATABASE_PATH: str = os.environ.get("DATABASE_PATH", os.path.join(ROOT_DIR, "careermatch.db")).strip()
DATABASE_URL: str = os.environ.get("DATABASE_URL", "").strip()

JWT_SECRET: str = os.environ.get("JWT_SECRET", "careermatch-ai-2-dev-secret-key-change-in-prod").strip()
JWT_EXPIRY_HOURS: int = int(os.environ.get("JWT_EXPIRY_HOURS", "72"))

GITHUB_TOKEN: str = os.environ.get("GITHUB_TOKEN", "").strip()
PORT: int = int(os.environ.get("PORT", "3000"))

CORS_ORIGINS: str = os.environ.get("CORS_ORIGINS", "").strip()
HEALTH_KEY: str = os.environ.get("HEALTH_KEY", "").strip()
GUEST_DATA_TTL_DAYS: int = int(os.environ.get("GUEST_DATA_TTL_DAYS", "30"))

# Production environment safety guard: refuse to start with insecure secret
if APP_ENV == "production":
    if not JWT_SECRET or JWT_SECRET == "careermatch-ai-2-dev-secret-key-change-in-prod" or len(JWT_SECRET) < 32:
        raise RuntimeError(
            "FATAL: Production mode (APP_ENV=production) requires a secure, non-default "
            "JWT_SECRET of at least 32 characters. Please set JWT_SECRET in environment variables."
        )
