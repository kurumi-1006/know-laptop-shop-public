"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";






export default function TestStreamPage() {
  const [log, setLog] = useState<string[]>([]);
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    api: "/api/test-stream",
    onError: (error) => {
      setLog((prev) => [...prev, `❌ Error: ${error.message}`]);
    },
  });

  const handleSend = () => {
    setLog((prev) => [...prev, `📤 Sending test message...`]);
    sendMessage({ text: "test" });
  };

  const handleReset = () => {
    stop();
    setMessages([]);
    setLog([]);
  };

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastText = lastAssistant?.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");


  const suggestionsMatch = lastText?.match(
    /<!--SUGGESTIONS:(\[[\s\S]*?\])-->/,
  );
  let suggestions: string[] = [];
  try {
    if (suggestionsMatch) suggestions = JSON.parse(suggestionsMatch[1]);
  } catch {

  }

  const visibleText = lastText
    ?.replace(/<!--SUGGESTIONS:[\s\S]*?-->/, "")
    .trimEnd();

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        fontFamily: "system-ui",
        padding: "0 20px",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>
        🧪 Stream Test Page
      </h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Click &ldquo;Send Test&rdquo; to verify token-by-token streaming. Words should
        appear one by one with ~100ms delay.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={handleSend}
          disabled={status === "submitted" || status === "streaming"}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {status === "streaming" ? "⏳ Streaming..." : "▶ Send Test"}
        </button>
        <button
          onClick={stop}
          disabled={status !== "streaming"}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ⏹ Stop
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          🔄 Reset
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {                   }
        <div>
          <h3 style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            Stream Output
          </h3>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              minHeight: 200,
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              Status:{" "}
              <strong>
                {status === "streaming"
                  ? "🟢 streaming"
                  : status === "submitted"
                    ? "🟡 submitted"
                    : "⚪ ready"}
              </strong>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {visibleText || (
                <span style={{ color: "#9ca3af" }}>
                  Waiting for stream...
                </span>
              )}
            </div>
            {suggestions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 8,
                  }}
                >
                  Follow-up suggestions:
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {suggestions.map((s) => (
                    <span
                      key={s}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        background: "#e0e7ff",
                        fontSize: 12,
                        color: "#3730a3",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {         }
        <div>
          <h3 style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            Log
          </h3>
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
              minHeight: 200,
              background: "#1e1e1e",
              color: "#d4d4d4",
              fontFamily: "monospace",
              fontSize: 11,
              overflow: "auto",
              maxHeight: 400,
            }}
          >
            {log.length === 0 ? (
              <span style={{ color: "#666" }}>No events yet</span>
            ) : (
              log.map((entry, i) => <div key={i}>{entry}</div>)
            )}
            <div style={{ color: "#4ade80" }}>
              Messages: {messages.length} | Status: {status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
