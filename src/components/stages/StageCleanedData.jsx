// src/components/stages/StageCleanedData.jsx
import React, { useState } from "react";
import ChangeHistoryDrawer from "../workspace/ChangeHistoryDrawer";
import { useDataset } from "../../context/DatasetContext";

export default function StageCleanedData() {
  const { currentVersion, rawVersion, activeRows, activeCols, setCurrentStage } = useDataset();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Verified Clean Banner */}
      <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#065F46" }}>
              Stage 04 — Verified Clean Dataset ({currentVersion?.version || "v4"})
            </div>
            <div style={{ fontSize: 12.5, color: "#047857" }}>
              {activeRows.length} rows × {activeCols.length} columns • 100% required field validation complete.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background: "#FFFFFF", border: "1px solid #10B981", color: "#047857", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            📜 View Changes & Compare
          </button>
          <button
            onClick={() => setCurrentStage("explore")}
            style={{ background: "#059669", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Explore Data →
          </button>
        </div>
      </div>

      {/* Table Data Preview */}
      <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, overflowX: "auto" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 12 }}>
          Cleaned Data Grid Preview ({currentVersion?.version || "v4"})
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--bg-primary, #F8FAFC)", borderBottom: "1px solid var(--border-color, #E2E8F0)" }}>
              {activeCols.map(c => <th key={c} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--text-secondary, #475569)" }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {activeRows.slice(0, 10).map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: "1px solid var(--border-color, #E2E8F0)" }}>
                {activeCols.map(c => <td key={c} style={{ padding: "8px 10px", color: "var(--text-primary, #0F172A)" }}>{String(row[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ChangeHistoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
