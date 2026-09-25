// src/components/stages/StageExplore.jsx
import React from "react";
import CorrelationHeatmap from "../../CorrelationHeatmap";
import DeepStatisticalSummary from "../../DeepStatisticalSummary";
import { useDataset } from "../../context/DatasetContext";

export default function StageExplore() {
  const { activeRows, activeCols, setCurrentStage } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 05 — Exploratory Data Analysis & Distributions</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Inspect statistical summaries, distribution metrics, and column correlations.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("insights")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          View AI Insights →
        </button>
      </div>

      <DeepStatisticalSummary data={activeRows} columns={activeCols} />
      <CorrelationHeatmap data={activeRows} columns={activeCols} />
    </div>
  );
}
