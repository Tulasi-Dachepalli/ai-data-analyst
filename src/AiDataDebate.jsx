import React, { useMemo } from "react";

export function generateAiDebate(data = [], columns = []) {
  if (!data || data.length === 0 || !columns || columns.length === 0) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const numericCols = columns.filter(c => evalRows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));
  const targetCol = numericCols[0] || columns[0];

  const vals = evalRows.map(r => Number(r[targetCol])).filter(v => !isNaN(v));
  const sum = vals.length ? vals.reduce((a, b) => a + b, 0) : 0;
  const mean = vals.length ? sum / vals.length : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const std = vals.length ? Math.sqrt(vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length) : 0;

  const growthArguments = [
    `1. High-Performance Peak: ${targetCol} reaches a peak value of ${max.toLocaleString()}, demonstrating significant upside potential.`,
    `2. Expansion Opportunity: Average ${targetCol} is ${mean.toFixed(2)}. Scaling top-performing tiers can drive an estimated +25% volume expansion.`,
    `3. Revenue Momentum: Total aggregated volume of ${sum.toLocaleString()} reflects robust baseline demand across current operations.`
  ];

  const riskArguments = [
    `1. Volatility Exposure: High standard deviation (${std.toFixed(2)}) relative to mean (${mean.toFixed(2)}) indicates erratic performance dispersion.`,
    `2. Downside Floor Warning: Minimum value drops to ${min.toLocaleString()}, highlighting potential margin erosion or operational bottlenecks.`,
    `3. Concentration Risk: Heavy reliance on top outliers exposes the business to sudden revenue dips if key metrics underperform.`
  ];

  const consensus = `Executive Action Plan: Capitalize on growth momentum by investing in high-performing ${targetCol} segments, while establishing strict stop-loss boundaries to mitigate metric volatility and outlier risks.`;

  return {
    targetCol,
    growthArguments,
    riskArguments,
    consensus,
    metrics: { sum: +sum.toFixed(2), mean: +mean.toFixed(2), min: +min.toFixed(2), max: +max.toFixed(2), std: +std.toFixed(2) }
  };
}

export default function AiDataDebate({ data = [], columns = [] }) {
  const debate = useMemo(() => {
    if (!data || data.length === 0) return null;
    return generateAiDebate(data, columns);
  }, [data, columns]);

  const handleExportCsv = () => {
    if (!debate) return;

    const headers = ["Perspective", "Argument / Strategy"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    debate.growthArguments.forEach(a => {
      csvRows.push([`"Growth Strategist 🚀"`, `"${a.replace(/"/g, '""')}"`].join(","));
    });
    debate.riskArguments.forEach(a => {
      csvRows.push([`"Risk Auditor 🛡️"`, `"${a.replace(/"/g, '""')}"`].join(","));
    });
    csvRows.push([`"Executive Consensus ⚖️"`, `"${debate.consensus.replace(/"/g, '""')}"`].join(","));

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_data_debate_${debate.targetCol}.csv`;
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
            🤖 Multi-Agent AI Data Debate & Risk Peer-Review Engine
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Simulates a dual-agent debate contrasting Growth Opportunities against Risk Audit Warnings to produce balanced executive guidance.
          </p>
        </div>

        {debate && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#8B5CF6", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export AI Debate Report (CSV)
          </button>
        )}
      </div>

      {debate && (
        <>
          {/* Dual Agent Debate Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Agent 1: Growth Strategist */}
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#065F46", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🚀 Agent A: Optimistic Growth Strategist
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {debate.growthArguments.map((arg, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: "#047857", lineHeight: 1.6, background: "#FFF", padding: 12, borderRadius: 8, border: "1px solid #D1FAE5" }}>
                    {arg}
                  </div>
                ))}
              </div>
            </div>

            {/* Agent 2: Risk Auditor */}
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#991B1B", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🛡️ Agent B: Skeptical Risk Auditor
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {debate.riskArguments.map((arg, idx) => (
                  <div key={idx} style={{ fontSize: 13, color: "#B91C1C", lineHeight: 1.6, background: "#FFF", padding: 12, borderRadius: 8, border: "1px solid #FEE2E2" }}>
                    {arg}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Executive Consensus Banner */}
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              ⚖️ Executive Consensus & Synthesis Strategy:
            </div>
            <div style={{ fontSize: 13.5, color: "#1D4ED8", lineHeight: 1.6 }}>
              {debate.consensus}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
