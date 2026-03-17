/**
 * App.tsx — root layout that wires together Sidebar + Chat panel.
 */
import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import { useChat } from "./hooks/useChat";

export default function App() {
  const {
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
  } = useChat();

  // Load any previously uploaded docs on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="h-screen flex bg-stone-950 text-stone-100 overflow-hidden font-sans">
      {/* Left sidebar */}
      <Sidebar
        documents={documents}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadError={uploadError}
        onClearChat={clearChat}
      />

      {/* Main chat panel */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <header className="shrink-0 h-14 border-b border-stone-800/80 flex items-center justify-between px-6 bg-stone-950/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-sm text-stone-400 font-medium">
              {documents.length > 0
                ? `${documents.length} document${documents.length > 1 ? "s" : ""} indexed · Ready`
                : "No documents — upload PDFs to begin"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            <span className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1">
              llama3-8b-8192
            </span>
            <span className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1">
              FAISS · SentenceTransformers
            </span>
          </div>
        </header>

        {/* Error banner */}
        {chatError && (
          <div className="shrink-0 mx-4 mt-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-2.5 text-xs text-red-400 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {chatError}
          </div>
        )}

        {/* Messages */}
        <ChatWindow messages={messages} hasDocuments={documents.length > 0} />

        {/* Input */}
        <ChatInput
          onSend={sendQuestion}
          disabled={isLoading}
          hasDocuments={documents.length > 0}
        />
      </main>
    </div>
  );
}
