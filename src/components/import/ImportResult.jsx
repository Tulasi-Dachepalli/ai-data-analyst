// src/components/import/ImportResult.jsx
import React from "react";

export default function ImportResult({ result, onOpenWorkspace }) {
  if (!result) return null;

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #BBF7D0",
      borderRadius: 14,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      boxShadow: "0 4px 16px rgba(22, 163, 74, 0.08)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#F0FDF4",
            color: "#16A34A",
            border: "1px solid #BBF7D0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800
          }}>
            ✓
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              Import Complete — {result.name}
            </div>
            <div style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>
              Stored as Raw Dataset Version v1 (Immutable)
            </div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", background: "#F0FDF4", padding: "4px 10px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
          🔒 Hash Verified
        </span>
      </div>

      {/* Dataset Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Total Rows</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
            {(result.rows ? result.rows.length : 0).toLocaleString()}
          </div>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Total Columns</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
            {result.cols ? result.cols.length : 0} Cols
          </div>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>File Size</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
            {result.fileSize || "—"}
          </div>
        </div>
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Raw SHA-256</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2563EB", marginTop: 4, fontFamily: "monospace" }}>
            {result.hash ? result.hash.slice(0, 16) + "..." : "—"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onOpenWorkspace}
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
          }}
        >
          🚀 Open Raw Dataset in Workspace →
        </button>
      </div>
    </div>
  );
}
