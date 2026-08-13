import React from "react";

const tips = [
  { icon: "🔍", title: "Exploratory Analysis", desc: "Upload any CSV/Excel and get instant charts, KPIs, and statistics." },
  { icon: "🧹", title: "Auto Data Cleaning", desc: "Detect missing values, duplicates, and whitespace — fix with one click." },
  { icon: "🤖", title: "ML Modeling", desc: "Auto-detect classification, regression, or clustering targets and train models." },
  { icon: "📈", title: "Forecasting", desc: "Time-series forecasting with Prophet, ARIMA, ETS — compare and project future values." },
  { icon: "💬", title: "AI Chat", desc: "Ask follow-up questions about your data in plain English." },
  { icon: "📊", title: "Download Reports", desc: "Export your analysis as Excel, HTML, or Word reports instantly." },
];

export default function InsightsPage({ onOpen }) {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>💡 Insights</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>What this AI Analyst can do for you</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {tips.map((t) => (
          <div key={t.title} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "18px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{t.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{t.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>{t.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <button
          onClick={onOpen}
          style={{ background: "var(--text-primary)", color: "var(--bg-primary)", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          → Start Analyzing
        </button>
      </div>
    </div>
  );
}
