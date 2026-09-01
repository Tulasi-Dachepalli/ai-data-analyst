import React, { useState, useMemo } from "react";

export function detectAnomalies(data = [], columns = []) {
  if (!data || data.length === 0 || !columns || columns.length === 0) return [];

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const numericCols = columns.filter(c => evalRows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));
  if (numericCols.length === 0) return [];

  const colStats = {};
  numericCols.forEach(col => {
    const vals = evalRows.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (vals.length < 5) return;

    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length) || 1;

    colStats[col] = { mean: +mean.toFixed(2), std: +std.toFixed(2) };
  });

  const anomalies = [];

  evalRows.forEach((row, rowIdx) => {
    numericCols.forEach(col => {
      if (!colStats[col]) return;
      const val = Number(row[col]);
      if (isNaN(val)) return;

      const { mean, std } = colStats[col];
      const zScore = (val - mean) / std;

      if (Math.abs(zScore) >= 2.5) {
        anomalies.push({
          id: `anomaly_${rowIdx}_${col}`,
          rowIndex: rowIdx + 1,
          column: col,
          value: val,
          mean,
          std,
          zScore: +zScore.toFixed(2),
          severity: Math.abs(zScore) >= 3.0 ? "extreme" : "moderate",
          rowData: row
        });
      }
    });
  });

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore)).slice(0, 50);
}

export default function AnomalyInvestigator({ data = [], columns = [], onCallAi }) {
  const anomalies = useMemo(() => {
    return detectAnomalies(data, columns);
  }, [data, columns]);

  const [selectedCol, setSelectedCol] = useState("all");
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filteredAnomalies = useMemo(() => {
    if (selectedCol === "all") return anomalies;
    return anomalies.filter(a => a.column === selectedCol);
  }, [anomalies, selectedCol]);

  const uniqueCols = useMemo(() => {
    return Array.from(new Set(anomalies.map(a => a.column)));
  }, [anomalies]);

  const handleInvestigate = async (anomaly) => {
    setActiveAnalysis({ anomaly, explanation: "Analyzing root causes with AI..." });
    setAiLoading(true);

    if (onCallAi) {
      const prompt = `System: You are an expert Data Scientist investigating a dataset anomaly.
Row #${anomaly.rowIndex} in column "${anomaly.column}" has a value of ${anomaly.value}, which is ${anomaly.zScore} standard deviations away from the column mean of ${anomaly.mean} (Standard Deviation = ${anomaly.std}).

Here is the full row record context:
${JSON.stringify(anomaly.rowData, null, 2)}

Please provide a concise, 3-bullet root-cause explanation analyzing why this anomaly occurred and what operational action should be taken.`;

      try {
        const res = await onCallAi(prompt);
        setActiveAnalysis({ anomaly, explanation: res || "No explanation generated." });
      } catch (e) {
        setActiveAnalysis({ anomaly, explanation: "Failed to generate AI explanation." });
      }
    } else {
      setActiveAnalysis({
        anomaly,
        explanation: `• Extreme deviation detected: Value of ${anomaly.value} is ${anomaly.zScore}x standard deviations from average (${anomaly.mean}).\n• Primary driver: Row record exhibits abnormal spikes across numerical features.\n• Recommended action: Flag row #${anomaly.rowIndex} for operational audit.`
      });
    }

    setAiLoading(false);
  };

  const handleExportCsv = () => {
    if (filteredAnomalies.length === 0) return;

    const headers = ["Row Index", "Column", "Value", "Column Mean", "Z-Score", "Severity"];
    const csvRows = [headers.join(",")];

    filteredAnomalies.forEach(a => {
      csvRows.push([a.rowIndex, `"${a.column}"`, a.value, a.mean, a.zScore, `"${a.severity}"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anomaly_investigation_log.csv";
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
            🚨 AI Outlier & Anomaly Root-Cause Investigator
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Isolates statistical anomalies ($|z| \ge 2.5\sigma$) and generates automated AI root-cause explanations.
          </p>
        </div>

        {filteredAnomalies.length > 0 && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Anomaly Log (CSV)
          </button>
        )}
      </div>

      {/* Summary & Filter Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 14, marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
          🚨 Found {anomalies.length} Statistical Outlier{anomalies.length > 1 ? "s" : ""} across dataset rows ($|z| \ge 2.5\sigma$)
        </div>

        {uniqueCols.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#7F1D1D" }}>Filter Column:</span>
            <select
              value={selectedCol}
              onChange={e => setSelectedCol(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #F87171", fontSize: 12, backgroundColor: "#FFF" }}
            >
              <option value="all">All Columns ({anomalies.length})</option>
              {uniqueCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Anomaly Table */}
      {filteredAnomalies.length > 0 ? (
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Row #</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Column</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Value</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Column Mean</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Z-Score</th>
                <th style={{ padding: "10px 12px", color: "#374151" }}>Severity</th>
                <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>AI Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnomalies.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>Row #{a.rowIndex}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1F2937" }}>{a.column}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#DC2626" }}>{a.value.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#6B7280" }}>{a.mean.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#991B1B" }}>{a.zScore > 0 ? `+${a.zScore}` : a.zScore}σ</td>
                  <td style={{ padding: "10px 12px" }}>
                    {a.severity === "extreme" ? (
                      <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        🔴 Extreme (&gt;3σ)
                      </span>
                    ) : (
                      <span style={{ backgroundColor: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                        🟡 Moderate (&gt;2.5σ)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleInvestigate(a)}
                      style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      🔍 Root Cause AI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#059669", fontSize: 13, backgroundColor: "#ECFDF5", borderRadius: 8 }}>
          ✅ Clean Dataset! No statistical outliers ($|z| \ge 2.5\sigma$) detected in numeric columns.
        </div>
      )}

      {/* AI Root-Cause Diagnostic Result Box */}
      {activeAnalysis && (
        <div style={{ backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 10, padding: 16, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0369A1" }}>
              🤖 AI Root-Cause Diagnostic (Row #{activeAnalysis.anomaly.rowIndex} - {activeAnalysis.anomaly.column}):
            </div>
            <button onClick={() => setActiveAnalysis(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#0369A1" }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: "#0C4A6E", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {aiLoading ? "⏳ Analyzing row context and generating AI diagnostic explanation..." : activeAnalysis.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
