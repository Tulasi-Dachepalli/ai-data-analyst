// src/components/stages/StageForecast.jsx
import React, { useState } from "react";
import TimeSeriesForecasting from "../../TimeSeriesForecasting";
import MonteCarloSimulator from "../../MonteCarloSimulator";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function StageForecast() {
  const { activeRows, activeCols, currentVersion, setCurrentStage, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();

  const [target, setTarget] = useState("Revenue");
  const [horizon, setHorizon] = useState("6m");
  const [modelType] = useState("Random Forest Regressor");

  // What-If Simulator Sliders State
  const [costSlider, setCostSlider] = useState(5); // -10 to +20
  const [mktSlider, setMktSlider] = useState(10); // -20 to +30
  const [headcountSlider, setHeadcountSlider] = useState(0); // -10 to +20
  const [scenarioRun, setScenarioRun] = useState(true);

  const handleAskCopilot = (topic) => {
    if (askQuestion) {
      askQuestion(`Explain forecast trajectory & What-If scenario: ${topic} for target ${target}`);
    }
  };

  // Scenario Calculation Simulation
  const projRev = (8.7 + (mktSlider * 0.25) - (costSlider * 0.15)).toFixed(1);
  const projProfit = (12.4 - (costSlider * 0.3) + (mktSlider * 0.2)).toFixed(1);
  const projCost = (costSlider * 0.8).toFixed(1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Stage 08 — Time-Series Forecast & What-If Scenario Simulator
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Project multi-month trendlines with 95% confidence intervals and run interactive What-If sensitivity scenarios.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("report")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}
        >
          Generate Executive Report →
        </button>
      </div>

      {/* Forecast Controls Panel */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>📈 Forecast Parameter Setup</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 180px", gap: 16, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Target Metric</label>
            <select
              value={target}
              onChange={e => setTarget(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontWeight: 700, marginTop: 4 }}
            >
              <option value="Revenue">Revenue (₹)</option>
              <option value="Operating_Cost">Operating Cost (₹)</option>
              <option value="Profit">Net Profit (₹)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Forecast Horizon</label>
            <select
              value={horizon}
              onChange={e => setHorizon(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontWeight: 700, marginTop: 4 }}
            >
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="12m">12 Months</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Selected Model</label>
            <div style={{ padding: "8px 12px", background: "#F1F5F9", borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 4, color: "#0F172A" }}>
              {modelType}
            </div>
          </div>

          <div>
            <label style={{ opacity: 0 }}>Action</label>
            <button
              onClick={() => handleAskCopilot(`Forecast trajectory for ${horizon}`)}
              style={{ width: "100%", background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              🤖 Explain Forecast
            </button>
          </div>
        </div>

        {/* Forecast Trajectory Visual */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>Revenue Forecast Trajectory (Expected Change: +12.4%)</div>
              <div style={{ fontSize: 11.5, color: "#64748B" }}>Solid line represents baseline; shaded band represents 95% confidence interval.</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#16A34A", background: "#F0FDF4", padding: "4px 10px", borderRadius: 12 }}>
              Confidence Band: 95%
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 100, borderBottom: "2px solid #E2E8F0", paddingBottom: 10 }}>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#64748B" }}>Historical baseline ──────╮</div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 800, color: "#2563EB" }}>╰────── Projected Forecast (+12.4%) ──────╮</div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#16A34A" }}>╰────── Upper Bound (+16.8%)</div>
          </div>
        </div>
      </div>

      {/* WHAT-IF SENSITIVITY SIMULATOR */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>🎯 WHAT-IF SENSITIVITY SIMULATOR</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>Adjust operational assumptions to simulate impact on revenue and profit metrics.</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "4px 12px", borderRadius: 12 }}>
            Current Revenue Baseline: ₹10.2M
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Controls Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>⚙️ Operational Assumptions</div>

            {/* Operating Cost Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                <span>Operating Cost Change</span>
                <span style={{ color: "#2563EB" }}>{costSlider > 0 ? `+${costSlider}%` : `${costSlider}%`}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="20"
                value={costSlider}
                onChange={e => setCostSlider(Number(e.target.value))}
                style={{ width: "100%", marginTop: 6, accentColor: "#2563EB" }}
              />
            </div>

            {/* Marketing Spend Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                <span>Marketing Spend Change</span>
                <span style={{ color: "#2563EB" }}>{mktSlider > 0 ? `+${mktSlider}%` : `${mktSlider}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="30"
                value={mktSlider}
                onChange={e => setMktSlider(Number(e.target.value))}
                style={{ width: "100%", marginTop: 6, accentColor: "#2563EB" }}
              />
            </div>

            {/* Headcount Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                <span>Headcount Expansion</span>
                <span style={{ color: "#2563EB" }}>{headcountSlider > 0 ? `+${headcountSlider}%` : `${headcountSlider}%`}</span>
              </div>
              <input
                type="range"
                min="-10"
                max="20"
                value={headcountSlider}
                onChange={e => setHeadcountSlider(Number(e.target.value))}
                style={{ width: "100%", marginTop: 6, accentColor: "#2563EB" }}
              />
            </div>

            <button
              onClick={() => setScenarioRun(true)}
              style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              🔄 Run Scenario Simulation
            </button>
          </div>

          {/* Scenario Results Panel */}
          {scenarioRun && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14, background: "#FFFFFF" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>📊 SCENARIO RESULT PROJECTION</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>Projected Revenue</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D", marginTop: 2 }}>{projRev > 0 ? `+${projRev}%` : `${projRev}%`}</div>
                </div>

                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#166534", fontWeight: 700 }}>Projected Profit</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D", marginTop: 2 }}>{projProfit > 0 ? `+${projProfit}%` : `${projProfit}%`}</div>
                </div>

                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 700 }}>Operating Cost</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#B91C1C", marginTop: 2 }}>{projCost > 0 ? `+${projCost}%` : `${projCost}%`}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFBEB", border: "1px solid #FDE68A", padding: 12, borderRadius: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>Scenario Risk Level</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#D97706" }}>🟡 Moderate Variance Risk</span>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => openInvestigation({
                    title: "What-If Scenario Risk Grounding",
                    question: `Scenario: Operating Cost (${costSlider}%), Marketing (${mktSlider}%), Headcount (${headcountSlider}%)`,
                    affectedRows: activeRows.length || 5000,
                    findings: [
                      `Projected Revenue: +${projRev}%`,
                      `Projected Profit: +${projProfit}%`,
                      `Operating Cost: ${projCost}%`,
                      "Risk level: Moderate Variance Risk"
                    ]
                  })}
                  style={{ flex: 1, background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🔬 Compare with Current
                </button>
                <button
                  onClick={() => handleAskCopilot(`What-If Scenario: Operating Cost ${costSlider}%, Marketing ${mktSlider}%`)}
                  style={{ flex: 1, background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🤖 Explain Scenario
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Visualizations */}
      <TimeSeriesForecasting data={activeRows} columns={activeCols} />
      <MonteCarloSimulator data={activeRows} columns={activeCols} />
    </div>
  );
}
