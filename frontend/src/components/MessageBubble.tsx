/**
 * MessageBubble — renders a single chat message with source attribution.
 */
import { useState } from "react";
import type { ChatMessage } from "../types";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-6`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold
          ${isUser
            ? "bg-amber-400 text-stone-900"
            : "bg-teal-500/20 border border-teal-500/40 text-teal-300"
          }`}
      >
        {isUser ? "YOU" : "AI"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-2`}>
        {message.isLoading ? (
          <div className="bg-stone-800 border border-stone-700/60 rounded-2xl rounded-tl-sm px-5 py-4">
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        ) : (
          <div
            className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
              ${isUser
                ? "bg-amber-400 text-stone-900 font-medium rounded-tr-sm"
                : "bg-stone-800 border border-stone-700/60 text-stone-200 rounded-tl-sm"
              }`}
          >
            {message.content}
          </div>
        )}

        {/* Source attribution toggle */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources((s) => !s)}
              className="text-xs text-teal-400/70 hover:text-teal-300 transition-colors flex items-center gap-1.5 ml-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6M9 16h6M9 8h4M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              {showSources ? "Hide" : "Show"} {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((src, i) => (
                  <div
                    key={i}
                    className="bg-stone-900 border border-teal-900/40 rounded-xl px-4 py-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-teal-400 font-medium truncate max-w-[200px]">
                        📄 {src.document}
                      </span>
                      <span className="text-stone-500 ml-2 shrink-0">
                        {(src.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-stone-400 line-clamp-3 leading-relaxed">
                      {src.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-stone-600 ml-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
