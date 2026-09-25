// src/components/stages/StageModeling.jsx
import React from "react";
import ClusterSegmentation from "../../ClusterSegmentation";
import { useDataset } from "../../context/DatasetContext";

export default function StageModeling() {
  const { activeRows, activeCols, setCurrentStage } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 07 — AutoML Training & Unsupervised Segmentation</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Train predictive ML classification / regression models and perform cluster segmentation.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("forecast")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Run Time-Series Forecast →
        </button>
      </div>

      <ClusterSegmentation data={activeRows} columns={activeCols} />
    </div>
  );
}
