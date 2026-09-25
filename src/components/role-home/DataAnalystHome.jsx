// src/components/role-home/DataAnalystHome.jsx
import React from "react";

export default function DataAnalystHome({ onOpenDataset, onAskQuestion }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#FFF", borderRadius: 16, padding: 24, boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📊 Data Analyst BI & Profiling Studio</div>
        <div style={{ fontSize: 13.5, color: "#94A3B8", maxWidth: 640, lineHeight: 1.6 }}>
          Upload raw datasets or connect data sources to execute automated data profiling, interactive EDA, statistical correlations, and executive BI report decks.
        </div>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div
          onClick={() => onAskQuestion && onAskQuestion("Run comprehensive Exploratory Data Analysis & summary statistics")}
          style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 18, cursor: "pointer", transition: "all 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2563EB"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color, #E2E8F0)"}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Automated EDA</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>Deep column profiling, missing data checks, and correlation heatmaps.</div>
        </div>

        <div
          onClick={() => onAskQuestion && onAskQuestion("Inspect missing values, duplicates, and clean dataset")}
          style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 18, cursor: "pointer", transition: "all 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2563EB"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color, #E2E8F0)"}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>🧹</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Data Health & Cleaning</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>Transactional cleaning, version lineage, and before/after previews.</div>
        </div>

        <div
          onClick={() => onAskQuestion && onAskQuestion("Generate executive summary report deck")}
          style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 18, cursor: "pointer", transition: "all 0.15s ease" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2563EB"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color, #E2E8F0)"}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Executive Reports</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>1-Click executive PDF decks, Excel exports, and board summaries.</div>
        </div>
      </div>
    </div>
  );
}
