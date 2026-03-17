/**
 * API service — all communication with the FastAPI backend lives here.
 * Components import from this file, never call fetch/axios directly.
 */
import axios from "axios";
import type {
  UploadResponse,
  ChatResponse,
  DocumentInfo,
  ChatMessage,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000, // 60 s — LLM calls can take a moment
});

// ── Documents ─────────────────────────────────────────────────────────────────

/**
 * Uploads one or more PDF files to the backend.
 * The backend extracts text, chunks, embeds, and indexes them.
 */
export async function uploadDocuments(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Fetches metadata for all documents that have been uploaded this session.
 */
export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const { data } = await api.get<{ documents: DocumentInfo[]; total: number }>(
    "/documents"
  );
  return data.documents;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * Sends a user question (plus conversation history) to the RAG pipeline
 * and returns the LLM's answer along with source chunk attribution.
 */
export async function sendMessage(
  question: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", {
    question,
    history: history.map(({ role, content }) => ({ role, content })),
  });
  return data;
}
