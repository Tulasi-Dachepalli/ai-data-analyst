import React, { useState, useMemo } from "react";

export function computeCohortRetention(data = [], dateCol = "", idCol = "") {
  if (!data || data.length === 0 || !dateCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const userFirstSeen = {};
  const userMonthlyActivity = {};

  evalRows.forEach(r => {
    const rawDate = r[dateCol];
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;

    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    const userId = idCol && r[idCol] ? String(r[idCol]) : `row_${Math.random()}`;

    if (!userFirstSeen[userId] || monthKey < userFirstSeen[userId]) {
      userFirstSeen[userId] = monthKey;
    }

    if (!userMonthlyActivity[userId]) {
      userMonthlyActivity[userId] = new Set();
    }
    userMonthlyActivity[userId].add(monthKey);
  });

  const cohortUsers = {};
  Object.entries(userFirstSeen).forEach(([userId, cohortMonth]) => {
    if (!cohortUsers[cohortMonth]) cohortUsers[cohortMonth] = [];
    cohortUsers[cohortMonth].push(userId);
  });

  const cohortMonths = Object.keys(cohortUsers).sort().slice(0, 10);
  if (cohortMonths.length === 0) return null;

  const matrix = {};
  const monthlyAverages = Array(7).fill(0);
  const monthlyCounts = Array(7).fill(0);

  cohortMonths.forEach(cohort => {
    const users = cohortUsers[cohort];
    const baseCount = users.length;
    matrix[cohort] = { baseCount, retention: [] };

    for (let m = 0; m <= 6; m++) {
      if (m === 0) {
        matrix[cohort].retention.push(100.0);
        monthlyAverages[0] += 100.0;
        monthlyCounts[0] += 1;
      } else {
        const cohortDate = new Date(`${cohort}-01`);
        cohortDate.setMonth(cohortDate.getMonth() + m);
        const targetMonthKey = cohortDate.toISOString().slice(0, 7);

        const retainedCount = users.filter(u => userMonthlyActivity[u]?.has(targetMonthKey)).length;
        const pct = baseCount > 0 ? +((retainedCount / baseCount) * 100).toFixed(1) : 0;
        
        matrix[cohort].retention.push(pct);
        monthlyAverages[m] += pct;
        monthlyCounts[m] += 1;
      }
    }
  });

  const avgRetention = monthlyAverages.map((sum, i) => (
    monthlyCounts[i] > 0 ? +(sum / monthlyCounts[i]).toFixed(1) : 0
  ));

  return { cohortMonths, matrix, avgRetention };
}

export default function CohortRetentionHeatmap({ data = [], columns = [] }) {
  const dateCols = useMemo(() => {
    return columns.filter(c => /date|time|created|joined|month|year|timestamp/i.test(c)) || columns;
  }, [columns]);

  const idCols = useMemo(() => {
    return columns.filter(c => /id|user|customer|code|sku|uuid/i.test(c)) || columns;
  }, [columns]);

  const [dateCol, setDateCol] = useState("");
  const [idCol, setIdCol] = useState("");

  const activeDate = dateCol || dateCols[0] || columns[0] || "";
  const activeId = idCol || idCols[0] || "";

  const cohortData = useMemo(() => {
    if (!data || data.length === 0 || !activeDate) return null;
    return computeCohortRetention(data, activeDate, activeId);
  }, [data, activeDate, activeId]);

  const getHeatmapColor = (pct) => {
    if (pct >= 80) return "rgba(16, 185, 129, 0.85)";
    if (pct >= 50) return "rgba(16, 185, 129, 0.55)";
    if (pct >= 30) return "rgba(245, 158, 11, 0.55)";
    if (pct > 0) return "rgba(239, 68, 68, 0.45)";
    return "#F3F4F6";
  };

  const handleExportCsv = () => {
    if (!cohortData) return;

    const headers = ["Acquisition Cohort", "Base Users", "M0", "M1", "M2", "M3", "M4", "M5", "M6"];
    const csvRows = [headers.join(",")];

    cohortData.cohortMonths.forEach(c => {
      const row = cohortData.matrix[c];
      csvRows.push([`"${c}"`, row.baseCount, ...row.retention.map(r => `"${r}%"`)].join(","));
    });

    const avgRow = ["Average Retention", "-", ...cohortData.avgRetention.map(a => `"${a}%"`)];
    csvRows.push(avgRow.join(","));

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cohort_retention_analysis.csv`;
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
            📊 Cohort Analysis & Customer Retention Heatmap
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Tracks user acquisition cohort retention rates across Month 0 to Month 6 with color-coded heatmap gradients.
          </p>
        </div>

        {cohortData && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Cohort Matrix (CSV)
          </button>
        )}
      </div>

      {/* Selector Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select Activity Date Field:</label>
          <select
            value={activeDate}
            onChange={e => setDateCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select User / Customer ID Field (Optional):</label>
          <select
            value={activeId}
            onChange={e => setIdCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            <option value="">Auto-detect / Row-based</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cohort Heatmap Grid */}
      {cohortData ? (
        <>
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "center" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>Acquisition Cohort</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, color: "#374151" }}>Base Users</th>
                  {["M0", "M1", "M2", "M3", "M4", "M5", "M6"].map(m => (
                    <th key={m} style={{ padding: "10px 12px", fontWeight: 700, color: "#374151" }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohortData.cohortMonths.map(c => {
                  const row = cohortData.matrix[c];
                  return (
                    <tr key={c} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#1F2937", background: "#FAFAFA" }}>{c}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#6B7280" }}>{row.baseCount.toLocaleString()}</td>
                      {row.retention.map((pct, idx) => (
                        <td
                          key={idx}
                          style={{
                            padding: "10px 12px",
                            backgroundColor: getHeatmapColor(pct),
                            color: pct >= 50 ? "#FFF" : "#1F2937",
                            fontWeight: 700
                          }}
                        >
                          {pct}%
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Average Retention Row */}
                <tr style={{ background: "#E5E7EB", fontWeight: 800, borderTop: "2px solid #D1D5DB" }}>
                  <td style={{ padding: "10px 12px", textAlign: "left", color: "#1F2937" }}>Average Retention Curve</td>
                  <td style={{ padding: "10px 12px", color: "#6B7280" }}>-</td>
                  {cohortData.avgRetention.map((avg, idx) => (
                    <td key={idx} style={{ padding: "10px 12px", color: "#059669" }}>
                      {avg}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Retention Insights Summary */}
          <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
              📈 Platform Retention Takeaways:
            </div>
            <div style={{ fontSize: 12.5, color: "#15803D", lineHeight: 1.5 }}>
              • Month 1 Retention Benchmark: <strong>{cohortData.avgRetention[1]}%</strong> &middot; Month 3 Retention: <strong>{cohortData.avgRetention[3]}%</strong>.<br />
              • Greatest retention drop occurs between <strong>M0 and M1</strong> (drop of {(100 - cohortData.avgRetention[1]).toFixed(1)}%). Implementing automated onboarding emails at Day 3 & Day 7 will boost M1 retention.
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          Please upload or select a dataset containing activity Date values to compute cohort retention analysis.
        </div>
      )}
    </div>
  );
}
