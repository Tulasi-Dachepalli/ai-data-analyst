// src/components/stages/StageDataQuality.jsx
import React from "react";
import DataHealthInspector from "../../DataHealthInspector";
import { useDataset } from "../../context/DatasetContext";

export default function StageDataQuality() {
  const { activeDataset, activeRows, activeCols, setCurrentStage } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 02 — Data Quality & Health Assessment</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Inspect dataset completeness, anomaly scores, duplicates, and column type validity.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("cleaning")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Proceed to Cleaning →
        </button>
      </div>

      <DataHealthInspector dataset={activeDataset} data={activeRows} columns={activeCols} />
    </div>
  );
}
