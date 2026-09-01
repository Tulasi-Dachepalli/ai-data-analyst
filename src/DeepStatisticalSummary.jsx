import React, { useMemo } from "react";

export function computeColumnAdvancedStats(data = [], col = "") {
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;
  const values = evalRows.map(r => Number(r[col])).filter(v => !isNaN(v));
  const n = values.length;

  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  const q1 = sorted[Math.floor(n * 0.25)] ?? min;
  const median = sorted[Math.floor(n * 0.50)] ?? mean;
  const q3 = sorted[Math.floor(n * 0.75)] ?? max;
  const iqr = q3 - q1;

  const variance = n > 1 ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  // Calculate Fisher-Pearson Skewness
  let skewness = 0;
  if (n >= 3 && stdDev > 0) {
    const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
    skewness = m3 / Math.pow(stdDev, 3);
  }

  let skewLabel = "Symmetrical";
  let skewColor = "#10B981";
  if (skewness > 0.5) {
    skewLabel = "Right-Skewed (+)";
    skewColor = "#F59E0B";
  } else if (skewness < -0.5) {
    skewLabel = "Left-Skewed (-)";
    skewColor = "#3B82F6";
  }

  return {
    column: col,
    count: data.length,
    mean: +mean.toFixed(2),
    stdDev: +stdDev.toFixed(2),
    min,
    q1: +q1.toFixed(2),
    median: +median.toFixed(2),
    q3: +q3.toFixed(2),
    max,
    iqr: +iqr.toFixed(2),
    skewness: +skewness.toFixed(2),
    skewLabel,
    skewColor
  };
}

export default function DeepStatisticalSummary({ data = [], columns = [] }) {
  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const statsList = useMemo(() => {
    if (!data || data.length === 0) return [];
    return numericCols.map(col => computeColumnAdvancedStats(data, col)).filter(Boolean);
  }, [data, numericCols]);

  const handleExportCsv = () => {
    if (statsList.length === 0) return;

    const headers = ["Column", "Count", "Mean", "StdDev", "Min", "Q1 (25%)", "Median (50%)", "Q3 (75%)", "Max", "IQR", "Skewness", "Distribution"];
    const csvRows = [headers.join(",")];

    statsList.forEach(s => {
      csvRows.push([
        `"${s.column}"`, s.count, s.mean, s.stdDev, s.min, s.q1, s.median, s.q3, s.max, s.iqr, s.skewness, `"${s.skewLabel}"`
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "descriptive_statistics_summary.csv";
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
            📐 Deep Statistical Profiling Summary
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Comprehensive parameter metrics: 25th percentile ($Q1$), Median ($50th$), 75th percentile ($Q3$), Interquartile Range ($IQR$), and Skewness.
          </p>
        </div>

        {statsList.length > 0 && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Statistics CSV
          </button>
        )}
      </div>

      {statsList.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          Please upload or select a dataset with numerical attributes to view deep statistical profiling.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB", color: "#374151" }}>
                <th style={{ padding: "10px 12px" }}>Attribute</th>
                <th style={{ padding: "10px 12px" }}>Count</th>
                <th style={{ padding: "10px 12px" }}>Mean (μ)</th>
                <th style={{ padding: "10px 12px" }}>Std Dev (σ)</th>
                <th style={{ padding: "10px 12px" }}>Min</th>
                <th style={{ padding: "10px 12px" }}>Q1 (25%)</th>
                <th style={{ padding: "10px 12px" }}>Median (50%)</th>
                <th style={{ padding: "10px 12px" }}>Q3 (75%)</th>
                <th style={{ padding: "10px 12px" }}>Max</th>
                <th style={{ padding: "10px 12px" }}>IQR</th>
                <th style={{ padding: "10px 12px" }}>Skewness</th>
                <th style={{ padding: "10px 12px" }}>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {statsList.map((s, idx) => (
                <tr key={s.column} style={{ borderBottom: "1px solid #F3F4F6", backgroundColor: idx % 2 === 0 ? "#FFF" : "#FAFAFA" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1F2937" }}>{s.column}</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280" }}>{s.count.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.mean.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>{s.stdDev.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280" }}>{s.min.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>{s.q1.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#3E6F8E" }}>{s.median.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>{s.q3.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280" }}>{s.max.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>{s.iqr.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>{s.skewness > 0 ? `+${s.skewness}` : s.skewness}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ backgroundColor: `${s.skewColor}15`, color: s.skewColor, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      {s.skewLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
