/**
 * ChatInput — text area + send button at the bottom of the chat panel.
 * Supports Shift+Enter for newline, Enter to submit.
 */
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  hasDocuments: boolean;
}

export function ChatInput({ onSend, disabled, hasDocuments }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = hasDocuments
    ? "Ask a question about your documents…"
    : "Upload PDFs first, then ask questions…";

  return (
    <div className="border-t border-stone-800 bg-stone-950/80 backdrop-blur-sm px-4 py-4">
      <div
        className={`flex items-end gap-3 bg-stone-900 border rounded-2xl px-4 py-3 transition-colors
          ${disabled || !hasDocuments
            ? "border-stone-800"
            : "border-stone-700 focus-within:border-teal-500/60"
          }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || !hasDocuments}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-stone-200 placeholder-stone-600
            outline-none leading-relaxed min-h-[24px] max-h-40 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !hasDocuments || !value.trim()}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
            bg-teal-500 hover:bg-teal-400 text-stone-900
            disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {disabled ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-stone-700 mt-2">
        Press <kbd className="bg-stone-800 px-1 rounded text-stone-500">Enter</kbd> to send · <kbd className="bg-stone-800 px-1 rounded text-stone-500">Shift+Enter</kbd> for newline
      </p>
    </div>
  );
}
