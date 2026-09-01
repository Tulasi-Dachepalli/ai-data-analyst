import React, { useState, useMemo } from "react";

export const INDUSTRY_PROFILES = {
  saas: {
    name: "SaaS & Technology 💻",
    benchmarks: [
      { name: "Gross Margin %", target: 75.0, unit: "%" },
      { name: "Annual Growth Rate", target: 30.0, unit: "%" },
      { name: "Net Retention Rate", target: 85.0, unit: "%" },
      { name: "CAC Payback Period", target: 12.0, unit: "mos" }
    ]
  },
  ecommerce: {
    name: "E-Commerce & Retail 🛒",
    benchmarks: [
      { name: "Gross Profit Margin", target: 45.0, unit: "%" },
      { name: "Average Order Value", target: 85.0, unit: "$" },
      { name: "Repeat Purchase Rate", target: 28.0, unit: "%" },
      { name: "Customer Retention", target: 60.0, unit: "%" }
    ]
  },
  healthcare: {
    name: "Healthcare & Life Sciences 🏥",
    benchmarks: [
      { name: "Operating Margin", target: 18.0, unit: "%" },
      { name: "Patient Retention", target: 78.0, unit: "%" },
      { name: "Compliance Rating", target: 95.0, unit: "%" },
      { name: "Capacity Utilization", target: 70.0, unit: "%" }
    ]
  },
  finance: {
    name: "Finance & Banking 🏦",
    benchmarks: [
      { name: "Capital Tier 1 Ratio", target: 15.0, unit: "%" },
      { name: "Net Interest Margin", target: 3.5, unit: "%" },
      { name: "Annual Loan Growth", target: 12.0, unit: "%" },
      { name: "Return on Equity (ROE)", target: 14.0, unit: "%" }
    ]
  }
};

export function computeIndustryBenchmarks(data = [], columns = [], industryKey = "saas") {
  if (!data || data.length === 0 || !columns || columns.length === 0) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const numericCols = columns.filter(c => evalRows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));
  if (numericCols.length === 0) return null;

  const profile = INDUSTRY_PROFILES[industryKey] || INDUSTRY_PROFILES.saas;

  const results = profile.benchmarks.map((bm, idx) => {
    const matchedCol = numericCols[idx % numericCols.length];
    const vals = evalRows.map(r => Number(r[matchedCol])).filter(v => !isNaN(v));
    const actualMean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

    const diff = actualMean - bm.target;
    const pctVar = bm.target !== 0 ? +((diff / bm.target) * 100).toFixed(1) : 0;

    let status = "healthy";
    if (pctVar >= 10.0) status = "outperforming";
    else if (pctVar < -10.0) status = "underperforming";

    return {
      name: bm.name,
      matchedCol,
      target: bm.target,
      actual: +actualMean.toFixed(2),
      pctVar,
      status,
      unit: bm.unit
    };
  });

  return { profileName: profile.name, results };
}

export default function IndustryBenchmarking({ data = [], columns = [] }) {
  const [industryKey, setIndustryKey] = useState("saas");

  const benchmarks = useMemo(() => {
    if (!data || data.length === 0) return null;
    return computeIndustryBenchmarks(data, columns, industryKey);
  }, [data, columns, industryKey]);

  const handleExportCsv = () => {
    if (!benchmarks) return;

    const headers = ["Benchmark KPI", "Dataset Column", "Industry Benchmark", "Actual Mean", "Variance %", "Status"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    benchmarks.results.forEach(r => {
      csvRows.push([`"${r.name}"`, `"${r.matchedCol}"`, `${r.target}${r.unit}`, `${r.actual}${r.unit}`, `"${r.pctVar}%"`, `"${r.status}"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `industry_benchmarks_${industryKey}.csv`;
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
            🎯 Industry KPI Benchmarking & Variance Scorecard
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Benchmarks dataset metrics against standard industry averages with performance variances ($\Delta\%$) and status badges.
          </p>
        </div>

        {benchmarks && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3B82F6", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Benchmarks (CSV)
          </button>
        )}
      </div>

      {/* Industry Profile Selector Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(INDUSTRY_PROFILES).map(([key, prof]) => (
          <button
            key={key}
            onClick={() => setIndustryKey(key)}
            style={{
              background: industryKey === key ? "#3B82F6" : "#F3F4F6",
              color: industryKey === key ? "#FFF" : "#374151",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {prof.name}
          </button>
        ))}
      </div>

      {/* Benchmark Scorecards */}
      {benchmarks && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            {benchmarks.results.map((res, idx) => (
              <div
                key={idx}
                style={{
                  background: res.status === "outperforming" ? "#ECFDF5" : (res.status === "underperforming" ? "#FEF2F2" : "#EFF6FF"),
                  border: `1px solid ${res.status === "outperforming" ? "#A7F3D0" : (res.status === "underperforming" ? "#FCA5A5" : "#BFDBFE")}`,
                  borderRadius: 10,
                  padding: 16
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#4B5563", textTransform: "uppercase" }}>{res.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#1F2937", margin: "4px 0" }}>
                  {res.actual.toLocaleString()}{res.unit}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: res.pctVar >= 0 ? "#059669" : "#DC2626" }}>
                  Benchmark: {res.target}{res.unit} ({res.pctVar >= 0 ? `+${res.pctVar}%` : `${res.pctVar}%`})
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Industry KPI</th>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Dataset Column</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Industry Benchmark</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Actual Dataset Mean</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Variance ($\Delta\%$)</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>Performance Rating</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.results.map((res, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{res.name}</td>
                    <td style={{ padding: "10px 12px", color: "#6B7280" }}>{res.matchedCol}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#4B5563" }}>{res.target}{res.unit}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{res.actual}{res.unit}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: res.pctVar >= 0 ? "#059669" : "#DC2626" }}>
                      {res.pctVar >= 0 ? `+${res.pctVar}%` : `${res.pctVar}%`}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {res.status === "outperforming" && <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🟢 Outperforming</span>}
                      {res.status === "healthy" && <span style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🔵 On Par / Healthy</span>}
                      {res.status === "underperforming" && <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🔴 Underperforming</span>}
                    </td>
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
