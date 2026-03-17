/**
 * useChat — custom hook that owns all chat state and interaction logic.
 * Components stay clean; they just call this hook and render.
 */
import { useState, useCallback } from "react";
import type { ChatMessage, DocumentInfo } from "../types";
import { uploadDocuments, sendMessage, fetchDocuments } from "../services/api";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadDocuments(files);
      setDocuments((prev) => {
        // Merge, deduplicate by id
        const ids = new Set(prev.map((d) => d.id));
        const fresh = result.documents.filter((d) => !ids.has(d.id));
        return [...prev, ...fresh];
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ?? err?.message ?? "Upload failed.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── Load documents list ─────────────────────────────────────────────────────

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch {
      // silently ignore — documents list is non-critical
    }
  }, []);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      setChatError(null);

      const userMessage: ChatMessage = {
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };

      // Optimistically append the user message + a loading placeholder
      const loadingMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsLoading(true);

      try {
        const response = await sendMessage(question, [
          ...messages,
          userMessage,
        ]);

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.answer,
          timestamp: new Date().toISOString(),
          sources: response.sources,
        };

        // Replace the loading placeholder with the real answer
        setMessages((prev) => [
          ...prev.slice(0, -1), // remove loading bubble
          assistantMessage,
        ]);
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail ?? err?.message ?? "Something went wrong.";
        setChatError(msg);

        // Replace loading bubble with error message
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: `Error: ${msg}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setChatError(null);
  }, []);

  return {
    messages,
    documents,
    isUploading,
    isLoading,
    uploadError,
    chatError,
    handleUpload,
    loadDocuments,
    sendQuestion,
    clearChat,
  };
}
