import React, { useState, useMemo } from "react";

export default function WhatIfSimulator({ data = [], columns = [] }) {
  const [growthPct, setGrowthPct] = useState(15);
  const [marginPct, setMarginPct] = useState(5);
  const [retentionPct, setRetentionPct] = useState(2);
  const [selectedColumn, setSelectedColumn] = useState("");

  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const activeCol = selectedColumn || numericCols[0] || "";

  const simulation = useMemo(() => {
    if (!activeCol || !data || data.length === 0) return null;

    const baseVals = data.map(r => Number(r[activeCol])).filter(v => !isNaN(v));
    const baseTotal = baseVals.reduce((a, b) => a + b, 0);
    const baseAvg = baseVals.length ? baseTotal / baseVals.length : 0;

    // Apply combined simulation multiplier
    const growthFactor = 1 + growthPct / 100;
    const marginFactor = 1 + marginPct / 100;
    const retentionFactor = 1 + retentionPct / 100;

    const simulatedTotal = baseTotal * growthFactor * marginFactor * retentionFactor;
    const simulatedAvg = baseAvg * growthFactor * marginFactor * retentionFactor;

    const delta = simulatedTotal - baseTotal;
    const deltaPct = baseTotal > 0 ? (delta / baseTotal) * 100 : 0;

    return {
      baseTotal,
      baseAvg,
      simulatedTotal,
      simulatedAvg,
      delta,
      deltaPct
    };
  }, [data, activeCol, growthPct, marginPct, retentionPct]);

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          🔮 Interactive "What-If" Scenario Simulator
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Simulate future revenue, metric growth, and pricing impact by adjusting strategic sliders.
        </p>
      </div>

      {numericCols.length === 0 ? (
        <div style={{ color: "#8A8580", fontSize: 13 }}>No numeric attributes found for scenario simulation.</div>
      ) : (
        <>
          {/* Target Column Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#4B5563", display: "block", marginBottom: 6 }}>
              Select Metric to Simulate:
            </label>
            <select
              value={activeCol}
              onChange={e => setSelectedColumn(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, minWidth: 200, backgroundColor: "#FFF" }}
            >
              {numericCols.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Sliders Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 24, background: "#F9FAFB", padding: 16, borderRadius: 10 }}>
            {/* Slider 1: Growth */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                <span>📈 Volume Growth Rate</span>
                <span style={{ color: "#8B5CF6", fontWeight: 700 }}>{growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                value={growthPct}
                onChange={e => setGrowthPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#8B5CF6" }}
              />
            </div>

            {/* Slider 2: Margin / Price */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                <span>🏷️ Pricing & Margin Shift</span>
                <span style={{ color: "#10B981", fontWeight: 700 }}>{marginPct > 0 ? `+${marginPct}%` : `${marginPct}%`}</span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                value={marginPct}
                onChange={e => setMarginPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10B981" }}
              />
            </div>

            {/* Slider 3: Retention */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                <span>🔄 Customer Retention Delta</span>
                <span style={{ color: "#3B82F6", fontWeight: 700 }}>{retentionPct > 0 ? `+${retentionPct}%` : `${retentionPct}%`}</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                value={retentionPct}
                onChange={e => setRetentionPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#3B82F6" }}
              />
            </div>
          </div>

          {/* Simulation Output Cards */}
          {simulation && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div style={{ background: "#F3F4F6", borderRadius: 10, padding: 16, border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Baseline Total ({activeCol})</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1F2937", marginTop: 4 }}>
                  {simulation.baseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ background: "#F0FDF4", borderRadius: 10, padding: 16, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Simulated Projected Total</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#15803D", marginTop: 4 }}>
                  {simulation.simulatedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ background: simulation.delta >= 0 ? "#F0F9FF" : "#FEF2F2", borderRadius: 10, padding: 16, border: `1px solid ${simulation.delta >= 0 ? "#BAE6FD" : "#FCA5A5"}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: simulation.delta >= 0 ? "#0369A1" : "#991B1B", textTransform: "uppercase" }}>Projected Variance Delta</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: simulation.delta >= 0 ? "#0284C7" : "#DC2626", marginTop: 4 }}>
                  {simulation.delta >= 0 ? `+${simulation.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : simulation.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span style={{ fontSize: 14, marginLeft: 6 }}>({simulation.deltaPct >= 0 ? `+${simulation.deltaPct.toFixed(1)}%` : `${simulation.deltaPct.toFixed(1)}%`})</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
