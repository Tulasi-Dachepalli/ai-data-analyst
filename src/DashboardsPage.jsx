import React from "react";

export default function DashboardsPage({ onOpen }) {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>📊 Dashboards</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Auto-generated visual dashboards from your uploaded files</div>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Dashboards are built automatically</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 8 }}>
          When you upload a file in the AI Analyst, a full dashboard is generated with:
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", margin: "12px 0 20px" }}>
          {["📈 KPI Cards", "🔗 Correlations", "📉 Trend Charts", "🗺 Region Maps", "🏷 Category Breakdowns"].map(item => (
            <span key={item} style={{ background: "var(--bg-hover)", border: "1px solid var(--border-color)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "var(--text-secondary)" }}>
              {item}
            </span>
          ))}
        </div>
        <button
          onClick={onOpen}
          style={{ background: "var(--accent-color, #0F172A)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          → Open AI Analyst
        </button>
      </div>
    </div>
  );
}
