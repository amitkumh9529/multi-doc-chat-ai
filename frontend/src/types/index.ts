// Shared TypeScript types used across the frontend

export interface DocumentInfo {
  id: string;
  filename: string;
  size_bytes: number;
  page_count: number;
  chunk_count: number;
  uploaded_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: SourceChunk[];
  isLoading?: boolean;
}

export interface SourceChunk {
  document: string;
  content: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
  model_used: string;
}

export interface UploadResponse {
  message: string;
  documents: DocumentInfo[];
}
