/**
 * ChatWindow — scrollable area that renders the full conversation.
 * Automatically scrolls to the latest message.
 */
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  hasDocuments: boolean;
}

export function ChatWindow({ messages, hasDocuments }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep scroll pinned to the bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
        {/* Hero icon */}
        <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal-400">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-stone-200 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ask anything about your documents
          </h2>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
            {hasDocuments
              ? "Your documents are ready. Type a question below to get started."
              : "Upload one or more PDFs using the sidebar, then start chatting."}
          </p>
        </div>

        {/* Example prompts */}
        {hasDocuments && (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            {[
              "Summarise the key points of this document",
              "What are the main conclusions?",
              "List all mentioned dates and deadlines",
            ].map((prompt) => (
              <div
                key={prompt}
                className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-400 text-left"
              >
                {prompt}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2 custom-scrollbar">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
