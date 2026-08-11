import React from "react";

export default function ReportsPage({ onOpen }) {
  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>📄 Reports</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>Export and download analysis reports from your datasets</div>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 10, padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { icon: "📊", title: "Excel Report (.xlsx)", desc: "Full workbook with raw data, statistics, cleaning log, ML model results, and forecast projections across multiple sheets." },
            { icon: "🌐", title: "HTML Report", desc: "Standalone web page with charts, data sample, and narrative — open in any browser or print as PDF." },
            { icon: "📄", title: "Word Report (.doc)", desc: "Executive summary document with ML insights and forecast data, formatted for sharing with stakeholders." },
          ].map(r => (
            <div key={r.title} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
            Open a dataset in the AI Analyst and click <strong>⬇ Download Report</strong> to export
          </div>
          <button
            onClick={onOpen}
            style={{ background: "var(--accent-color, #0F172A)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            → Go to AI Analyst
          </button>
        </div>
      </div>
    </div>
  );
}
