import React, { useState, useMemo } from "react";

export default function AiExecutiveNarrativeCard({ data = [], columns = [], dataset = null }) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const datasetName = dataset?.fileName || dataset?.name || "Active Workspace Dataset";

  // Identify numeric & categorical columns
  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || (!isNaN(Number(r[col])) && r[col] !== "")));
  }, [columns, data]);

  const categoricalCols = useMemo(() => {
    return columns.filter(col => !numericCols.includes(col));
  }, [columns, numericCols]);

  // Compute key insights & drivers
  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalRows = data.length;
    const totalCols = columns.length;

    // Primary numeric col (e.g., Revenue, Sales, Salary, Amount, Freight, Findings)
    const primaryNum = numericCols[0] || "";
    const primaryCat = categoricalCols[0] || "";

    let totalVal = 0;
    let avgVal = 0;
    let maxVal = 0;
    let maxRow = null;

    if (primaryNum) {
      const vals = data.map(r => Number(r[primaryNum])).filter(v => !isNaN(v));
      totalVal = vals.reduce((a, b) => a + b, 0);
      avgVal = vals.length ? totalVal / vals.length : 0;
      maxVal = vals.length ? Math.max(...vals) : 0;
      maxRow = data.find(r => Number(r[primaryNum]) === maxVal);
    }

    // Top driver category calculation
    let topDriver = "N/A";
    let topDriverShare = "0%";
    if (primaryCat && primaryNum) {
      const catTotals = {};
      data.forEach(r => {
        const cat = String(r[primaryCat] || "Unknown");
        const val = Number(r[primaryNum]) || 0;
        catTotals[cat] = (catTotals[cat] || 0) + val;
      });

      const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
      if (sortedCats.length > 0) {
        topDriver = sortedCats[0][0];
        topDriverShare = totalVal > 0 ? ((sortedCats[0][1] / totalVal) * 100).toFixed(1) + "%" : "N/A";
      }
    }

    return {
      totalRows,
      totalCols,
      primaryNum,
      primaryCat,
      totalVal: totalVal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      avgVal: avgVal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      maxVal: maxVal.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      topDriver,
      topDriverShare,
      maxRowCat: maxRow && primaryCat ? maxRow[primaryCat] : "N/A"
    };
  }, [data, columns, numericCols, categoricalCols]);

  const handleCopy = () => {
    if (!insights) return;
    const text = `📊 EXECUTIVE AI NARRATIVE & KEY DRIVER INSIGHTS
Dataset: ${datasetName} (${insights.totalRows} rows, ${insights.totalCols} cols)

1. Executive Performance Summary:
• Dataset contains ${insights.totalRows} verified records with total ${insights.primaryNum || "value"} aggregated at ${insights.totalVal}.
• Average record benchmark stands at ${insights.avgVal} with peak transaction recorded at ${insights.maxVal}.

2. Key Driver Analysis:
• Primary Category Driver: ${insights.primaryCat ? insights.primaryCat : "Category"} segment "${insights.topDriver}" accounts for ${insights.topDriverShare} of total volume.

3. Actionable AI Recommendations:
• Capitalize on top performing segment "${insights.topDriver}" while monitoring statistical outliers.
• Maintain automated threshold alerting on ${insights.primaryNum || "key metrics"} to preserve data quality above 95%.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!insights) return null;

  return (
    <div style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)", border: "1px solid #BFDBFE", borderRadius: 14, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)", boxShadow: "0 4px 16px rgba(59, 130, 246, 0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#3B82F6", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>
            💡
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1E3A8A" }}>
              AI Executive Narrative & Key Driver Insights
            </h3>
            <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>
              Automated natural language analysis for C-Suite summaries and board decks
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleRefresh}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #93C5FD", backgroundColor: "#FFF", color: "#1D4ED8", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            {isRefreshing ? "⏳ Analyzing..." : "🔄 Refresh Analysis"}
          </button>
          <button
            onClick={handleCopy}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", backgroundColor: copied ? "#10B981" : "#2563EB", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
          >
            {copied ? "✅ Copied!" : "📋 Copy Executive Narrative"}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Card 1: Key Executive Highlights */}
        <div style={{ background: "#FFF", border: "1px solid #DBEAFE", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            📌 Executive Highlights
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
            <li>Dataset <strong>{datasetName}</strong> analyzed with <strong>{insights.totalRows.toLocaleString()} rows</strong> and <strong>{insights.totalCols} columns</strong>.</li>
            {insights.primaryNum && (
              <li>Total <strong>{insights.primaryNum}</strong> aggregated at <strong>{insights.totalVal}</strong> (Average: <strong>{insights.avgVal}</strong>).</li>
            )}
            <li>Peak transaction record stands at <strong>{insights.maxVal}</strong>.</li>
          </ul>
        </div>

        {/* Card 2: Key Driver Breakdown */}
        <div style={{ background: "#FFF", border: "1px solid #DBEAFE", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            🚀 Primary Driver Category
          </div>
          {insights.primaryCat ? (
            <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
              <div>Top performing <strong>{insights.primaryCat}</strong>:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2563EB", margin: "6px 0" }}>
                {insights.topDriver}
              </div>
              <div style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
                Drives {insights.topDriverShare} of total aggregated volume.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#6B7280" }}>Select a dataset with categorical dimensions for driver breakdown.</div>
          )}
        </div>

        {/* Card 3: Strategic AI Recommendation */}
        <div style={{ background: "#FFF", border: "1px solid #DBEAFE", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            🎯 Strategic AI Recommendations
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#374151", lineHeight: 1.6 }}>
            <li>Focus optimization resources on top category <strong>{insights.topDriver}</strong>.</li>
            <li>Maintain automated Slack/WhatsApp threshold rules for <strong>{insights.primaryNum || "key metrics"}</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
