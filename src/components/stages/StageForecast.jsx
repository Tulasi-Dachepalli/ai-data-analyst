// src/components/stages/StageForecast.jsx
import React from "react";
import TimeSeriesForecasting from "../../TimeSeriesForecasting";
import MonteCarloSimulator from "../../MonteCarloSimulator";
import { useDataset } from "../../context/DatasetContext";

export default function StageForecast() {
  const { activeRows, activeCols, setCurrentStage } = useDataset();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 08 — AI Time-Series Forecasting & Monte Carlo Projections</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Project future trendlines with 95% confidence bounds and run Monte Carlo risk simulations.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("report")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Generate Executive Report →
        </button>
      </div>

      <TimeSeriesForecasting data={activeRows} columns={activeCols} />
      <MonteCarloSimulator data={activeRows} columns={activeCols} />
    </div>
  );
}
