"""
scripts/build_vector_index.py

Standalone utility to pre-build a FAISS index from a folder of PDFs.
Useful for batch-ingesting documents before starting the server.

Usage:
    cd multi-doc-chat-ai
    python scripts/build_vector_index.py --docs data/raw_docs

The script reuses the same services used by the FastAPI backend so the
resulting index is immediately compatible with the running application.
"""
import sys
import os
import argparse

# Make backend importable when running from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.document_service import process_document, get_all_chunks_with_sources
from app.services.vector_service import build_index


def main():
    parser = argparse.ArgumentParser(description="Build FAISS vector index from PDFs.")
    parser.add_argument(
        "--docs",
        default=os.path.join(os.path.dirname(__file__), "..", "data", "raw_docs"),
        help="Path to folder containing PDF files (default: data/raw_docs)",
    )
    args = parser.parse_args()

    docs_dir = os.path.abspath(args.docs)
    if not os.path.isdir(docs_dir):
        print(f"[ERROR] Directory not found: {docs_dir}")
        sys.exit(1)

    pdf_files = [f for f in os.listdir(docs_dir) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print(f"[WARN] No PDF files found in {docs_dir}")
        sys.exit(0)

    print(f"[INFO] Found {len(pdf_files)} PDF file(s) in {docs_dir}\n")

    for filename in pdf_files:
        filepath = os.path.join(docs_dir, filename)
        with open(filepath, "rb") as f:
            file_bytes = f.read()

        print(f"  ⏳  Processing: {filename} ({len(file_bytes) // 1024} KB) …", end="", flush=True)
        meta = process_document(
            file_bytes=file_bytes,
            filename=filename,
            file_size=len(file_bytes),
        )
        print(f"  ✓  {meta['page_count']} pages → {meta['chunk_count']} chunks")

    print("\n[INFO] Building FAISS index …")
    pairs = get_all_chunks_with_sources()
    total = build_index(pairs)
    print(f"[DONE] Index built with {total} vectors. Saved to data/vector_index/\n")


if __name__ == "__main__":
    main()
