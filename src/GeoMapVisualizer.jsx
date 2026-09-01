import React, { useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export function computeGeoDensity(data = [], geoCol = "", metricCol = "") {
  if (!data || data.length === 0 || !geoCol || !metricCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const grouped = {};
  let totalMetric = 0;

  evalRows.forEach(r => {
    const loc = r[geoCol] !== undefined && r[geoCol] !== null ? String(r[geoCol]).trim() : "(blank)";
    const val = Number(r[metricCol]);
    if (loc && !isNaN(val)) {
      grouped[loc] = (grouped[loc] || 0) + val;
      totalMetric += val;
    }
  });

  if (totalMetric <= 0) return null;

  const sortedLocs = Object.entries(grouped)
    .map(([location, value]) => ({
      location,
      value: +value.toFixed(2),
      pctShare: +((value / totalMetric) * 100).toFixed(1)
    }))
    .sort((a, b) => b.value - a.value);

  const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6", "#F97316"];

  const chartData = sortedLocs.slice(0, 15).map((loc, idx) => ({
    ...loc,
    fillColor: colors[idx % colors.length]
  }));

  return {
    sortedLocs,
    totalMetric: +totalMetric.toFixed(2),
    top1: sortedLocs[0] || null,
    top2: sortedLocs[1] || null,
    top3: sortedLocs[2] || null,
    chartData
  };
}

export default function GeoMapVisualizer({ data = [], columns = [] }) {
  const geoCols = useMemo(() => {
    return columns.filter(c => /country|state|city|region|location|geo|zip|address|zone|area/i.test(c)) || columns;
  }, [columns]);

  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [geoCol, setGeoCol] = useState("");
  const [metricCol, setMetricCol] = useState("");

  const activeGeo = geoCol || geoCols[0] || columns[0] || "";
  const activeMetric = metricCol || numericCols[0] || "";

  const geoData = useMemo(() => {
    if (!data || data.length === 0 || !activeGeo || !activeMetric) return null;
    return computeGeoDensity(data, activeGeo, activeMetric);
  }, [data, activeGeo, activeMetric]);

  const handleExportCsv = () => {
    if (!geoData) return;

    const headers = [activeGeo, activeMetric, "% Market Share"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    geoData.sortedLocs.forEach(loc => {
      csvRows.push([`"${loc.location}"`, loc.value, `"${loc.pctShare}%"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `geo_regional_data_${activeGeo}.csv`;
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
            🗺️ Interactive Regional Geo-Map Heatmap Visualizer
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Aggregates metric totals across countries, states, or cities into regional density heatmaps and market leaderboards.
          </p>
        </div>

        {geoData && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Regional Geo Data (CSV)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Select Geo Location Dimension:</label>
          <select
            value={activeGeo}
            onChange={e => setGeoCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Select Metric to Aggregate:</label>
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

      {/* Regional Leaderboard Scorecards & Chart */}
      {geoData && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            {geoData.top1 && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>🥇 #1 Market Leader</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", margin: "4px 0" }}>{geoData.top1.location}</div>
                <div style={{ fontSize: 11.5, color: "#047857" }}>
                  {geoData.top1.value.toLocaleString()} ({geoData.top1.pctShare}% Share)
                </div>
              </div>
            )}

            {geoData.top2 && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>🥈 #2 Market Leader</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", margin: "4px 0" }}>{geoData.top2.location}</div>
                <div style={{ fontSize: 11.5, color: "#1D4ED8" }}>
                  {geoData.top2.value.toLocaleString()} ({geoData.top2.pctShare}% Share)
                </div>
              </div>
            )}

            {geoData.top3 && (
              <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>🥉 #3 Market Leader</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706", margin: "4px 0" }}>{geoData.top3.location}</div>
                <div style={{ fontSize: 11.5, color: "#B45309" }}>
                  {geoData.top3.value.toLocaleString()} ({geoData.top3.pctShare}% Share)
                </div>
              </div>
            )}
          </div>

          {/* Regional Density Heatmap Chart */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
              📊 Regional Volume Density Heatmap (Top 15 Locations):
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData.chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="location" stroke="#6B7280" fontSize={11} angle={-25} textAnchor="end" height={44} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" name={activeMetric} radius={[4, 4, 0, 0]}>
                  {geoData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fillColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Data Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Rank</th>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Location ({activeGeo})</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Total {activeMetric}</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>% Market Share</th>
                </tr>
              </thead>
              <tbody>
                {geoData.sortedLocs.slice(0, 50).map((loc, idx) => (
                  <tr key={loc.location} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{idx + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{loc.location}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{loc.value.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#059669", fontWeight: 700 }}>{loc.pctShare}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
