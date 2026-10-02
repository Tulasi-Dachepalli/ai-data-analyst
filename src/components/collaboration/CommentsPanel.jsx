// src/components/collaboration/CommentsPanel.jsx
import React, { useState } from "react";
import { useCollaboration } from "../../context/CollaborationContext";

export default function CommentsPanel() {
  const { comments, addComment, openShareModal } = useCollaboration();
  const [text, setText] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;
    addComment(text);
    setText("");
  };

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>💬 TEAM COLLABORATION & COMMENTS</div>
          <div style={{ fontSize: 12, color: "#64748B" }}>Discuss grounded data findings, share analysis threads, and leave notes.</div>
        </div>
        <button
          onClick={() => openShareModal("South Region Cost Analysis")}
          style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          🚀 Share Analysis
        </button>
      </div>

      {/* Comment Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handlePost()}
          placeholder="Add a team comment or reply to thread..."
          style={{ flex: 1, border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
        />
        <button
          onClick={handlePost}
          disabled={!text.trim()}
          style={{ background: !text.trim() ? "#CBD5E1" : "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: !text.trim() ? "default" : "pointer" }}
        >
          Post Comment
        </button>
      </div>

      {/* Comments List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {comments.map(c => (
          <div key={c.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2563EB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {c.avatar}
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{c.author}</span>
              </div>
              <span style={{ fontSize: 11, color: "#64748B" }}>{c.time}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.4 }}>{c.comment}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
