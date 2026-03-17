"""
Document service — handles PDF ingestion, text extraction, and chunking.

RAG pipeline steps covered here:
  1. Load PDF bytes
  2. Extract raw text page by page
  3. Split text into overlapping chunks
"""
import os
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Tuple

import PyPDF2
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


# In-memory registry of processed documents
# { doc_id: DocumentInfo-like dict }
_document_registry: dict = {}


def _doc_id_from_filename(filename: str) -> str:
    """Creates a stable, short ID from the filename."""
    return hashlib.md5(filename.encode()).hexdigest()[:12]


def extract_text_from_pdf(file_bytes: bytes, filename: str) -> Tuple[str, int]:
    """
    Extracts plain text from a PDF file.

    Returns:
        (full_text, page_count)
    """
    import io
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    page_count = len(reader.pages)

    pages_text = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if page_text.strip():
            # Prefix each page's text with its source for traceability
            pages_text.append(f"[{filename} | Page {i + 1}]\n{page_text}")

    return "\n\n".join(pages_text), page_count


def split_into_chunks(text: str) -> List[str]:
    """
    Splits extracted text into overlapping chunks using LangChain's splitter.

    Overlap ensures that context spanning a chunk boundary isn't lost.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],  # try natural breaks first
    )
    return splitter.split_text(text)


def process_document(file_bytes: bytes, filename: str, file_size: int) -> dict:
    """
    Full ingestion pipeline for a single PDF:
      extract → chunk → register metadata.

    Returns a metadata dict compatible with DocumentInfo schema.
    """
    doc_id = _doc_id_from_filename(filename)

    # Step 1: extract text
    full_text, page_count = extract_text_from_pdf(file_bytes, filename)

    # Step 2: chunk
    chunks = split_into_chunks(full_text)

    # Step 3: store metadata
    metadata = {
        "id": doc_id,
        "filename": filename,
        "size_bytes": file_size,
        "page_count": page_count,
        "chunk_count": len(chunks),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "chunks": chunks,           # kept in memory for vector indexing
    }
    _document_registry[doc_id] = metadata

    return metadata


def get_all_documents() -> List[dict]:
    """Returns metadata for all ingested documents (without chunk data)."""
    return [
        {k: v for k, v in doc.items() if k != "chunks"}
        for doc in _document_registry.values()
    ]


def get_all_chunks_with_sources() -> List[Tuple[str, str]]:
    """
    Returns all (chunk_text, source_filename) pairs across every document.
    Used when rebuilding the FAISS index after new uploads.
    """
    pairs = []
    for doc in _document_registry.values():
        for chunk in doc.get("chunks", []):
            pairs.append((chunk, doc["filename"]))
    return pairs


def document_count() -> int:
    return len(_document_registry)
