"""
Vector service — manages the FAISS index and semantic similarity search.

RAG pipeline steps covered here:
  4. Generate embeddings (SentenceTransformers)
  5. Store in FAISS
  6. Retrieve top-k chunks for a user query
"""
import os
import pickle
import numpy as np
from typing import List, Tuple

import faiss
from sentence_transformers import SentenceTransformer

from app.core.config import settings


# ── Module-level state ────────────────────────────────────────────────────────

_embedding_model: SentenceTransformer | None = None

# FAISS flat index for cosine similarity (L2 on normalised vectors = cosine)
_faiss_index: faiss.IndexFlatIP | None = None

# Parallel list — index i corresponds to the chunk at _faiss_index row i
_chunk_texts: List[str] = []
_chunk_sources: List[str] = []   # which document each chunk came from

# Path to persist the index between restarts (optional but useful)
_INDEX_PATH = os.path.join(settings.VECTOR_INDEX_DIR, "index.faiss")
_META_PATH  = os.path.join(settings.VECTOR_INDEX_DIR, "meta.pkl")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_model() -> SentenceTransformer:
    """Lazy-loads the embedding model once and caches it."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _embedding_model


def _embed(texts: List[str]) -> np.ndarray:
    """
    Embeds a list of strings and returns L2-normalised vectors.
    Normalisation makes the inner-product equivalent to cosine similarity.
    """
    model = _get_model()
    vectors = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    # Normalise so dot-product == cosine similarity
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return (vectors / np.maximum(norms, 1e-10)).astype("float32")


# ── Public API ────────────────────────────────────────────────────────────────

def build_index(chunk_source_pairs: List[Tuple[str, str]]) -> int:
    """
    (Re)builds the FAISS index from all document chunks.

    Args:
        chunk_source_pairs: list of (chunk_text, source_filename)

    Returns:
        Total number of vectors indexed.
    """
    global _faiss_index, _chunk_texts, _chunk_sources

    if not chunk_source_pairs:
        return 0

    texts   = [p[0] for p in chunk_source_pairs]
    sources = [p[1] for p in chunk_source_pairs]

    # Generate embeddings for every chunk
    vectors = _embed(texts)
    dim = vectors.shape[1]

    # Inner-product index (works as cosine similarity after normalisation)
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    _faiss_index  = index
    _chunk_texts  = texts
    _chunk_sources = sources

    # Persist to disk
    os.makedirs(settings.VECTOR_INDEX_DIR, exist_ok=True)
    faiss.write_index(index, _INDEX_PATH)
    with open(_META_PATH, "wb") as f:
        pickle.dump({"texts": texts, "sources": sources}, f)

    return index.ntotal


def search(query: str, top_k: int = settings.TOP_K_RESULTS) -> List[dict]:
    """
    Embeds the query and returns the top-k most similar chunks.

    Returns a list of dicts: {content, document, score}
    """
    global _faiss_index, _chunk_texts, _chunk_sources

    # Try loading a persisted index if in-memory one is absent
    if _faiss_index is None:
        _load_persisted_index()

    if _faiss_index is None or _faiss_index.ntotal == 0:
        return []

    query_vec = _embed([query])     # shape: (1, dim)
    scores, indices = _faiss_index.search(query_vec, min(top_k, _faiss_index.ntotal))

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        results.append({
            "content":  _chunk_texts[idx],
            "document": _chunk_sources[idx],
            "score":    float(score),
        })
    return results


def index_size() -> int:
    """Returns the number of vectors currently in the index."""
    if _faiss_index is None:
        return 0
    return _faiss_index.ntotal


def _load_persisted_index():
    """Attempts to restore a previously saved FAISS index from disk."""
    global _faiss_index, _chunk_texts, _chunk_sources
    if os.path.exists(_INDEX_PATH) and os.path.exists(_META_PATH):
        _faiss_index = faiss.read_index(_INDEX_PATH)
        with open(_META_PATH, "rb") as f:
            meta = pickle.load(f)
        _chunk_texts   = meta["texts"]
        _chunk_sources = meta["sources"]
