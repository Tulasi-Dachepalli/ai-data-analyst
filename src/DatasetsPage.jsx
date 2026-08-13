import React from "react";

export default function DatasetsPage({ onOpen }) {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>📁 Datasets</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>All files you have uploaded and analyzed</div>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Your datasets live in the AI Analyst</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 20 }}>Upload CSV or Excel files and they'll appear in the sidebar as threads</div>
        <button
          onClick={onOpen}
          style={{ background: "var(--text-primary)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          → Open AI Analyst
        </button>
      </div>
    </div>
  );
}
