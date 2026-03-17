"""
Core configuration — loads env variables and exposes app-wide settings.
"""
import os
from dotenv import load_dotenv

_CORE_DIR = os.path.dirname(os.path.abspath(__file__))
_APP_DIR  = os.path.dirname(_CORE_DIR)
_BACKEND  = os.path.dirname(_APP_DIR)
_ROOT     = os.path.dirname(_BACKEND)

# Try backend/.env first, then project root .env
load_dotenv(os.path.join(_BACKEND, ".env"), override=False)
load_dotenv(os.path.join(_ROOT,    ".env"), override=False)


class Settings:
    APP_NAME: str    = "Multi-Doc Chat AI"
    APP_VERSION: str = "1.0.0"

    GROQ_API_KEY: str  = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    CHUNK_SIZE: int    = int(os.getenv("CHUNK_SIZE",    "1000"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    TOP_K_RESULTS: int = int(os.getenv("TOP_K_RESULTS", "4"))

    DATA_DIR: str         = os.path.join(_ROOT, "data")
    RAW_DOCS_DIR: str     = os.path.join(_ROOT, "data", "raw_docs")
    VECTOR_INDEX_DIR: str = os.path.join(_ROOT, "data", "vector_index")

    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
