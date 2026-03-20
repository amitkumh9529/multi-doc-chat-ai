"""
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
import re
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # move any heavy init here (FAISS loading, model loading, DB connections)
    # e.g. from app.core.vector_store import load_index; load_index()
    yield

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Document AI Chat Assistant — RAG pipeline with FAISS + Groq LLM",
    
)

# Allow React dev server (and production build) to communicate with the API

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://multi-doc-chat-ai.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routes under /api prefix
app.include_router(router, prefix="/api")


@app.get("/")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
