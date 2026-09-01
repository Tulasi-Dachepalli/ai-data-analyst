import React, { useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export function runMonteCarloSimulation(data = [], metricCol = "", volatilityPct = 15, numTrials = 1000) {
  if (!data || data.length === 0 || !metricCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const vals = evalRows.map(r => Number(r[metricCol])).filter(v => !isNaN(v));
  if (vals.length === 0) return null;

  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length) || 1;

  const volFactor = volatilityPct / 100;
  const trials = [];

  // Box-Muller Gaussian Transform
  for (let i = 0; i < numTrials; i++) {
    const u1 = Math.random() || 0.0001;
    const u2 = Math.random() || 0.0001;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const simulatedVal = mean + z * (std * (1 + volFactor));
    trials.push(+simulatedVal.toFixed(2));
  }

  trials.sort((a, b) => a - b);

  const p10 = trials[Math.floor(numTrials * 0.10)];
  const p50 = trials[Math.floor(numTrials * 0.50)];
  const p90 = trials[Math.floor(numTrials * 0.90)];

  // Create Histogram Bins (15 bins)
  const minVal = trials[0];
  const maxVal = trials[trials.length - 1];
  const binWidth = (maxVal - minVal) / 15 || 1;

  const bins = Array(15).fill(0).map((_, idx) => {
    const start = minVal + idx * binWidth;
    const end = start + binWidth;
    const count = trials.filter(v => v >= start && (idx === 14 ? v <= end : v < end)).length;
    return {
      binLabel: `${Math.round(start).toLocaleString()}`,
      binRange: `${Math.round(start).toLocaleString()} - ${Math.round(end).toLocaleString()}`,
      frequency: count
    };
  });

  return { trials, p10, p50, p90, mean: +mean.toFixed(2), std: +std.toFixed(2), bins };
}

export default function MonteCarloSimulator({ data = [], columns = [] }) {
  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [metricCol, setMetricCol] = useState("");
  const [volatilityPct, setVolatilityPct] = useState(15);

  const activeMetric = metricCol || numericCols[0] || "";

  const simulation = useMemo(() => {
    if (!data || data.length === 0 || !activeMetric) return null;
    return runMonteCarloSimulation(data, activeMetric, volatilityPct, 1000);
  }, [data, activeMetric, volatilityPct]);

  const handleExportCsv = () => {
    if (!simulation) return;

    const headers = ["Trial #", "Simulated Outcome"];
    const csvRows = [headers.join(",")];

    simulation.trials.forEach((v, idx) => {
      csvRows.push([idx + 1, v].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monte_carlo_simulation_${activeMetric}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
            🎲 Monte Carlo Risk & Financial Scenario Simulator
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Runs 1,000 stochastic Gaussian simulation trials projecting P10 (Worst-Case), P50 (Expected), and P90 (Best-Case) risk percentiles.
          </p>
        </div>

        {simulation && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#8B5CF6", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Simulation Log (CSV)
          </button>
        )}
      </div>

      {/* Configurator Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Select Target Metric:</label>
          <select
            value={activeMetric}
            onChange={e => setMetricCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
            2. Volatility / Market Uncertainty (&plusmn;{volatilityPct}%):
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={volatilityPct}
            onChange={e => setVolatilityPct(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#8B5CF6" }}
          />
        </div>
      </div>

      {/* Outcome Percentile Scorecard */}
      {simulation && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>🔴 P10 Worst-Case (Downside)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#DC2626", margin: "4px 0" }}>{simulation.p10.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#7F1D1D" }}>10% probability of falling below this floor.</div>
            </div>

            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>🔵 P50 Median (Expected Baseline)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", margin: "4px 0" }}>{simulation.p50.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#1D4ED8" }}>50% baseline expected outcome.</div>
            </div>

            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>🟢 P90 Best-Case (Upside)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", margin: "4px 0" }}>{simulation.p90.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#047857" }}>90% probability threshold for high target.</div>
            </div>
          </div>

          {/* Histogram Distribution Chart */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
              📊 1,000 Trial Stochastic Frequency Distribution Histogram:
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={simulation.bins} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="binLabel" stroke="#6B7280" fontSize={10.5} angle={-20} textAnchor="end" height={40} />
                <YAxis stroke="#6B7280" fontSize={10.5} label={{ value: "Trial Frequency", angle: -90, position: 'left' }} />
                <Tooltip />
                <Bar dataKey="frequency" name="Trials Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
