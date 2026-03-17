"""
Pydantic models for request/response validation across the API.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Document schemas ────────────────────────────────────────────────────────

class DocumentInfo(BaseModel):
    """Metadata returned for each uploaded document."""
    id: str
    filename: str
    size_bytes: int
    page_count: int
    chunk_count: int
    uploaded_at: str


class UploadResponse(BaseModel):
    """Response after successfully uploading and processing PDFs."""
    message: str
    documents: List[DocumentInfo]


# ── Chat schemas ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role: str          # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    """Payload sent by the frontend when the user submits a question."""
    question: str
    history: Optional[List[ChatMessage]] = []   # previous turns for context


class SourceChunk(BaseModel):
    """A retrieved document chunk included in the response for transparency."""
    document: str
    content: str
    score: float


class ChatResponse(BaseModel):
    """Response returned to the frontend after RAG + LLM inference."""
    answer: str
    sources: List[SourceChunk]
    model_used: str


# ── Document list schema ─────────────────────────────────────────────────────

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total: int
