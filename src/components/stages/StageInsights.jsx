// src/components/stages/StageInsights.jsx
import React from "react";
import AiExecutiveNarrativeCard from "../../AiExecutiveNarrativeCard";
import AnomalyInvestigator from "../../AnomalyInvestigator";
import { useDataset } from "../../context/DatasetContext";

export default function StageInsights() {
  const { activeDataset, activeRows, activeCols, setCurrentStage } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 06 — AI Executive Insights & Anomalies</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            AI-extracted executive findings, variance explanations, and outlier investigations.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("modeling")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Build Predictive Model →
        </button>
      </div>

      <AiExecutiveNarrativeCard data={activeRows} columns={activeCols} dataset={activeDataset} />
      <AnomalyInvestigator data={activeRows} columns={activeCols} />
    </div>
  );
}
