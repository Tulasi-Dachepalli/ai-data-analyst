import React, { useState, useMemo } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";

export function computeParetoDistribution(data = [], categoryCol = "", metricCol = "") {
  if (!data || data.length === 0 || !categoryCol || !metricCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const grouped = {};
  let totalMetric = 0;

  evalRows.forEach(r => {
    const cat = r[categoryCol] !== undefined && r[categoryCol] !== null ? String(r[categoryCol]).trim() : "(blank)";
    const val = Number(r[metricCol]);
    if (!isNaN(val)) {
      grouped[cat] = (grouped[cat] || 0) + val;
      totalMetric += val;
    }
  });

  if (totalMetric <= 0) return null;

  const sortedCategories = Object.entries(grouped)
    .map(([cat, val]) => ({ category: cat, value: +val.toFixed(2) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  let runningSum = 0;
  let cutoffIndex = -1;

  const paretoData = sortedCategories.map((item, idx) => {
    runningSum += item.value;
    const cumPct = +((runningSum / totalMetric) * 100).toFixed(1);
    if (cumPct >= 80 && cutoffIndex === -1) {
      cutoffIndex = idx;
    }
    return {
      ...item,
      cumPct,
      pctShare: +((item.value / totalMetric) * 100).toFixed(1)
    };
  });

  const topItemsCount = cutoffIndex !== -1 ? cutoffIndex + 1 : paretoData.length;
  const topItemsPct = +((topItemsCount / paretoData.length) * 100).toFixed(1);
  const topItemsValPct = paretoData[topItemsCount - 1]?.cumPct || 100;

  return { paretoData, totalMetric: +totalMetric.toFixed(2), topItemsCount, topItemsPct, topItemsValPct };
}

export default function ParetoAnalysis({ data = [], columns = [] }) {
  const categoricalCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "string" || isNaN(Number(r[c])))) || columns;
  }, [columns, data]);

  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [categoryCol, setCategoryCol] = useState("");
  const [metricCol, setMetricCol] = useState("");

  const activeCategory = categoryCol || categoricalCols[0] || columns[0] || "";
  const activeMetric = metricCol || numericCols[0] || "";

  const pareto = useMemo(() => {
    if (!data || data.length === 0 || !activeCategory || !activeMetric) return null;
    return computeParetoDistribution(data, activeCategory, activeMetric);
  }, [data, activeCategory, activeMetric]);

  const handleExportCsv = () => {
    if (!pareto) return;

    const headers = [activeCategory, activeMetric, "% Share of Total", "Cumulative % Contribution"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    pareto.paretoData.forEach(item => {
      csvRows.push([`"${item.category}"`, item.value, `"${item.pctShare}%"`, `"${item.cumPct}%"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pareto_analysis_${activeCategory}.csv`;
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
            📊 Pareto Analysis (80/20 Rule Analyzer)
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Identifies vital few categories driving 80% of total revenue/metrics using cumulative percentage distributions.
          </p>
        </div>

        {pareto && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Pareto Analysis (CSV)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select Category Dimension:</label>
          <select
            value={activeCategory}
            onChange={e => setCategoryCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select Metric Field:</label>
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
      </div>

      {/* Pareto Chart & Table */}
      {pareto ? (
        <>
          {/* 80/20 Takeaways Banner */}
          <div style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1E40AF", marginBottom: 4 }}>
              💡 Pareto 80/20 Takeaway:
            </div>
            <div style={{ fontSize: 13, color: "#1D4ED8", lineHeight: 1.5 }}>
              Top <strong>{pareto.topItemsCount} out of {pareto.paretoData.length}</strong> categories ({pareto.topItemsPct}% of items) drive <strong>{pareto.topItemsValPct}%</strong> of total {activeMetric} (Total: ${pareto.totalMetric.toLocaleString()}).
            </div>
          </div>

          {/* Dual-Axis Pareto Chart */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={pareto.paretoData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="category" stroke="#6B7280" fontSize={11} angle={-20} textAnchor="end" height={44} />
                <YAxis yAxisId="left" stroke="#3E6F8E" fontSize={11} label={{ value: activeMetric, angle: -90, position: 'left' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#EF4444" fontSize={11} unit="%" />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar yAxisId="left" dataKey="value" name={activeMetric} fill="#3E6F8E" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Cumulative %" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
                <ReferenceLine yAxisId="right" y={80} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "80% Cutoff", fill: "#EF4444", fontSize: 11, position: "top" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative Contribution Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Rank</th>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Category</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>{activeMetric}</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>% Share</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Cumulative %</th>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>80/20 Status</th>
                </tr>
              </thead>
              <tbody>
                {pareto.paretoData.map((item, idx) => (
                  <tr key={item.category} style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: item.cumPct <= 80 ? "#F0FDF4" : "transparent" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{idx + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.category}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{item.value.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.pctShare}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#EF4444" }}>{item.cumPct}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      {item.cumPct <= 80 ? (
                        <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          🏆 Vital 80% Driver
                        </span>
                      ) : (
                        <span style={{ backgroundColor: "#F3F4F6", color: "#6B7280", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>
                          Secondary
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          Please select valid categorical and numerical fields to run Pareto 80/20 analysis.
        </div>
      )}
    </div>
  );
}
