/**
 * Sidebar — shows the FileUploader and a list of all indexed documents.
 */
import type { DocumentInfo } from "../types";
import { FileUploader } from "./FileUploader";

interface Props {
  documents: DocumentInfo[];
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  uploadError: string | null;
  onClearChat: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Sidebar({
  documents,
  onUpload,
  isUploading,
  uploadError,
  onClearChat,
}: Props) {
  return (
    <aside className="w-72 shrink-0 flex flex-col bg-stone-950 border-r border-stone-800/80 overflow-hidden">
      {/* Brand header */}
      <div className="px-5 pt-6 pb-5 border-b border-stone-800/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal-400">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-stone-100 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              DocChat AI
            </h1>
            <p className="text-[10px] text-stone-600 mt-0.5">RAG-powered assistant</p>
          </div>
        </div>
      </div>

      {/* Upload section */}
      <div className="px-4 pt-5 pb-4 border-b border-stone-800/60">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500 mb-3">
          Upload Documents
        </p>
        <FileUploader
          onUpload={onUpload}
          isUploading={isUploading}
          error={uploadError}
        />
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 custom-scrollbar">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-500">
            Documents
          </p>
          {documents.length > 0 && (
            <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full px-2 py-0.5">
              {documents.length}
            </span>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="text-xs text-stone-600 text-center mt-6 leading-relaxed">
            No documents yet. Upload PDFs above to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-3 group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-stone-300 truncate leading-snug">
                      {doc.filename}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-stone-600">
                        {doc.page_count}p
                      </span>
                      <span className="text-[10px] text-stone-700">·</span>
                      <span className="text-[10px] text-stone-600">
                        {doc.chunk_count} chunks
                      </span>
                      <span className="text-[10px] text-stone-700">·</span>
                      <span className="text-[10px] text-stone-600">
                        {formatBytes(doc.size_bytes)}
                      </span>
                    </div>
                  </div>
                  {/* Indexed badge */}
                  <div className="shrink-0">
                    <span className="text-[9px] bg-teal-500/10 text-teal-500 border border-teal-500/20 rounded px-1.5 py-0.5">
                      indexed
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-4 border-t border-stone-800/60">
        <button
          onClick={onClearChat}
          className="w-full text-xs text-stone-500 hover:text-stone-300 transition-colors flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-stone-900"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
          Clear conversation
        </button>
      </div>
    </aside>
  );
}
