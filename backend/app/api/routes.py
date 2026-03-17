"""
FastAPI route handlers.

Endpoints:
  POST /upload     — ingest one or more PDF files
  POST /chat       — answer a question via the RAG pipeline
  GET  /documents  — list all uploaded documents
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import List

from app.models.schemas import (
    UploadResponse, DocumentInfo,
    ChatRequest, ChatResponse, SourceChunk,
    DocumentListResponse,
)
from app.services import document_service, vector_service
from app.llm.groq_client import query_groq

router = APIRouter()


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload_documents(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    processed_docs: List[DocumentInfo] = []

    for upload in files:
        if not upload.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=415,
                detail=f"'{upload.filename}' is not a PDF. Only PDF files are supported.",
            )

        file_bytes = await upload.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail=f"'{upload.filename}' is empty.")

        try:
            meta = document_service.process_document(
                file_bytes=file_bytes,
                filename=upload.filename,
                file_size=len(file_bytes),
            )
            processed_docs.append(DocumentInfo(**{k: v for k, v in meta.items() if k != "chunks"}))
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process '{upload.filename}': {str(exc)}",
            )

    all_pairs = document_service.get_all_chunks_with_sources()
    vector_service.build_index(all_pairs)

    return UploadResponse(
        message=f"Successfully processed {len(processed_docs)} document(s).",
        documents=processed_docs,
    )


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if vector_service.index_size() == 0:
        raise HTTPException(
            status_code=400,
            detail="No documents have been uploaded yet. Please upload PDFs first.",
        )

    results = vector_service.search(query=request.question)

    if not results:
        return ChatResponse(
            answer="I couldn't find any relevant content in the uploaded documents.",
            sources=[],
            model_used=settings.GROQ_MODEL,
        )

    context_parts = [f"[Source: {r['document']}]\n{r['content']}" for r in results]
    context = "\n\n---\n\n".join(context_parts)

    try:
        answer = await query_groq(
            context=context,
            question=request.question,
            history=request.history or [],
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"{type(exc).__name__}: {str(exc)}")

    sources = [
        SourceChunk(document=r["document"], content=r["content"][:300], score=r["score"])
        for r in results
    ]

    return ChatResponse(
        answer=answer,
        sources=sources,
        model_used=settings.GROQ_MODEL,
    )


@router.get("/documents", response_model=DocumentListResponse, status_code=status.HTTP_200_OK)
async def list_documents():
    docs = document_service.get_all_documents()
    return DocumentListResponse(
        documents=[DocumentInfo(**d) for d in docs],
        total=len(docs),
    )


# import needed for model_used field
from app.core.config import settings
