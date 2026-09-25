// src/components/common/BeforeAfterTable.jsx
import React from "react";

export default function BeforeAfterTable({ beforeRows = [], afterRows = [], columns = [], title = "Transformation Preview" }) {
  if (!columns || columns.length === 0) return null;

  return (
    <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{title}</span>
        <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Showing Before vs After Diff</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, overflowX: "auto" }}>
        {/* BEFORE CONTAINER */}
        <div style={{ background: "rgba(239, 68, 68, 0.03)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔴 BEFORE (Original)</span>
            <span style={{ fontSize: 10, background: "#FEE2E2", padding: "1px 6px", borderRadius: 4 }}>{beforeRows.length} rows</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
            <thead>
              <tr style={{ background: "rgba(239, 68, 68, 0.08)", borderBottom: "1px solid rgba(239, 68, 68, 0.2)" }}>
                {columns.slice(0, 4).map(c => <th key={c} style={{ padding: "4px 6px", textAlign: "left", color: "#991B1B" }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {beforeRows.slice(0, 5).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(239, 68, 68, 0.1)" }}>
                  {columns.slice(0, 4).map(c => <td key={c} style={{ padding: "4px 6px", color: row[c] === null || row[c] === undefined ? "#EF4444" : "#475569" }}>{String(row[c] ?? "NULL")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AFTER CONTAINER */}
        <div style={{ background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🟢 AFTER (Transformed)</span>
            <span style={{ fontSize: 10, background: "#D1FAE5", padding: "1px 6px", borderRadius: 4 }}>{afterRows.length} rows</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
            <thead>
              <tr style={{ background: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(16, 185, 129, 0.2)" }}>
                {columns.slice(0, 4).map(c => <th key={c} style={{ padding: "4px 6px", textAlign: "left", color: "#065F46" }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {afterRows.slice(0, 5).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(16, 185, 129, 0.1)" }}>
                  {columns.slice(0, 4).map(c => <td key={c} style={{ padding: "4px 6px", color: "#0F172A", fontWeight: 600 }}>{String(row[c] ?? "")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
