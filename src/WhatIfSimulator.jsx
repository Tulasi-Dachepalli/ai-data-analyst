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
          {/* Quick Scenario Preset Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280" }}>⚡ Quick Scenario Presets:</span>
            <button
              type="button"
              onClick={() => { setGrowthPct(25); setMarginPct(10); setRetentionPct(5); }}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #BBF7D0", backgroundColor: "#F0FDF4", color: "#166534", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🚀 Aggressive Expansion (+25% Vol, +10% Price)
            </button>
            <button
              type="button"
              onClick={() => { setGrowthPct(5); setMarginPct(2); setRetentionPct(0); }}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🛡️ Conservative Baseline (+5% Vol, +2% Price)
            </button>
            <button
              type="button"
              onClick={() => { setGrowthPct(-15); setMarginPct(-5); setRetentionPct(-5); }}
              style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #FCA5A5", backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              ⚠️ Market Contraction (-15% Vol, -5% Price)
            </button>
          </div>

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
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
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

              {/* Side-by-Side Scenario Comparison Matrix Table */}
              <div style={{ marginTop: 24, borderTop: "1px solid #E5E7EB", paddingTop: 20 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#1F2937", display: "flex", alignItems: "center", gap: 8 }}>
                  📊 Side-by-Side Scenario Matrix Comparison
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, backgroundColor: "#FFF", borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Scenario</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Volume Delta</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Price Delta</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Projected Total</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Net Impact ($)</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#4B5563" }}>Baseline Current</td>
                        <td style={{ padding: "10px 14px" }}>0%</td>
                        <td style={{ padding: "10px 14px" }}>0%</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{simulation.baseTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px" }}>$0.00</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ backgroundColor: "#E5E7EB", color: "#374151", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Current</span></td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: "#F0FDF4" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#166534" }}>🚀 Aggressive Expansion</td>
                        <td style={{ padding: "10px 14px", color: "#15803D", fontWeight: 600 }}>+25%</td>
                        <td style={{ padding: "10px 14px", color: "#15803D", fontWeight: 600 }}>+10%</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "#15803D" }}>{(simulation.baseTotal * 1.25 * 1.10 * 1.05).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px", color: "#15803D", fontWeight: 700 }}>+{(simulation.baseTotal * (1.25 * 1.10 * 1.05 - 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>High Growth</span></td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#3B82F6" }}>🛡️ Conservative Baseline</td>
                        <td style={{ padding: "10px 14px" }}>+5%</td>
                        <td style={{ padding: "10px 14px" }}>+2%</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{(simulation.baseTotal * 1.05 * 1.02).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px", color: "#2563EB", fontWeight: 700 }}>+{(simulation.baseTotal * (1.05 * 1.02 - 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ backgroundColor: "#DBEAFE", color: "#1E40AF", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Steady</span></td>
                      </tr>
                      <tr style={{ backgroundColor: simulation.delta >= 0 ? "#EFF6FF" : "#FEF2F2" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "#1E3A8A" }}>🎛️ Active Custom Simulation</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{growthPct > 0 ? `+${growthPct}%` : `${growthPct}%`}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 700 }}>{marginPct > 0 ? `+${marginPct}%` : `${marginPct}%`}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800 }}>{simulation.simulatedTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: simulation.delta >= 0 ? "#0284C7" : "#DC2626" }}>
                          {simulation.delta >= 0 ? `+${simulation.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : simulation.delta.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ backgroundColor: simulation.delta >= 0 ? "#BFDBFE" : "#FCA5A5", color: simulation.delta >= 0 ? "#1E40AF" : "#991B1B", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                            {simulation.delta >= 0 ? "Simulated Gain" : "Simulated Risk"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
