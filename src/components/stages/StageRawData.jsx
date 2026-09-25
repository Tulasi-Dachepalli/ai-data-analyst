// src/components/stages/StageRawData.jsx
import React from "react";
import { useDataset } from "../../context/DatasetContext";

export default function StageRawData() {
  const { rawVersion, activeRows, activeCols, setCurrentStage } = useDataset();
  const rows = rawVersion ? rawVersion.rows : activeRows;
  const cols = rawVersion ? rawVersion.columns : activeCols;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Immutability Banner */}
      <div style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Stage 01 — Original Raw Data (Immutable v1)</div>
            <div style={{ fontSize: 12, color: "#B45309" }}>
              Original data is strictly locked and read-only. All future cleaning operations create traceable versions.
            </div>
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("quality")}
          style={{ background: "#D97706", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Continue to Data Quality →
        </button>
      </div>

      {/* Raw Data Table View */}
      <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, overflowX: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
          <span>Raw Dataset Preview ({rows.length} rows × {cols.length} columns)</span>
          <span style={{ fontSize: 11, color: "#64748B" }}>Hash: {rawVersion?.hash || "v1-original"}</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-primary, #F8FAFC)", borderBottom: "1px solid var(--border-color, #E2E8F0)" }}>
              {cols.map(c => <th key={c} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-secondary, #475569)" }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-color, #E2E8F0)" }}>
                {cols.map(c => <td key={c} style={{ padding: "8px 10px", color: "var(--text-primary, #0F172A)" }}>{String(row[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
