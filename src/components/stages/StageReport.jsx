// src/components/stages/StageReport.jsx
import React from "react";
import ExecutiveReportGenerator from "../../ExecutiveReportGenerator";
import { useDataset } from "../../context/DatasetContext";

export default function StageReport() {
  const { activeDataset, activeRows, activeCols } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 09 — Automated Executive Report Deck & Export</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
          Compile full data preparation, EDA findings, ML model evaluations, and forecasts into a 1-click presentation deck.
        </div>
      </div>

      <ExecutiveReportGenerator dataset={activeDataset} data={activeRows} columns={activeCols} />
    </div>
  );
}
