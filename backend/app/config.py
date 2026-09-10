"""
Application settings.

Every secret and environment-specific value (API keys, database URL, etc.)
is read from environment variables instead of being written into the code.
During local development these are loaded from a ".env" file - see
".env.example" in this folder for the list of variables you need to set.
"""

import os
from dotenv import load_dotenv

# Load variables from backend/.env into the environment (if the file exists)
load_dotenv()


class Settings:
    # --- Groq API ---
    # Required. Get a free key from https://console.groq.com/keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Which Groq model to use for text generation (tool calling).
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    # Which Groq model to use for image/vision inputs.
    GROQ_VISION_MODEL: str = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

    # --- PostgreSQL database ---
    # Format: postgresql://<user>:<password>@<host>:<port>/<database_name>
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:Shlok1234@localhost:5432/content_platform",
    )

    # --- CORS ---
    # The URL where the React frontend runs, so the browser is allowed to call this API.
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # --- Authentication & JWT ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "contentmorph-super-secret-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


settings = Settings()

if not settings.GROQ_API_KEY:
    print(
        "WARNING: GROQ_API_KEY is not set. "
        "Add it to backend/.env before calling /api/generate."
    )
