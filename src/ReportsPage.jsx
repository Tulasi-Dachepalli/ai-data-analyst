import React, { useState, useEffect } from "react";

export default function ReportsPage({ onOpen }) {
  const [savedReports, setSavedReports] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aida_saved_reports") || "[]");
    } catch (e) {
      return [];
    }
  });

  return (
    <div style={{ padding: "16px 0", maxWidth: 1080, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#EFF6FF",
          color: "#2563EB",
          fontSize: 11,
          fontWeight: 700,
          padding: "3px 8px",
          borderRadius: 6,
          marginBottom: 6,
          textTransform: "uppercase"
        }}>
          Enterprise Reporting Center
        </div>
        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text-primary, #0F172A)",
          margin: "0 0 6px 0",
          fontFamily: "var(--font-heading, 'Manrope', sans-serif)"
        }}>
          📄 Automated Reports & Executive Decks
        </h1>
        <div style={{ fontSize: 13.5, color: "var(--text-secondary, #64748B)" }}>
          Save board-ready analytical summaries directly to your PC, export raw Excel workbooks, or dispatch reports automatically to leadership via email.
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{
        background: "var(--bg-secondary, #FFFFFF)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 16,
        padding: "28px 24px",
        boxShadow: "var(--shadow-sm)",
        marginBottom: 24
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { icon: "📄", title: "Printable PDF / HTML Deck", desc: "Board-ready executive brief with automated KPI cards, data quality grade, and AI insights.", action: "Save to PC" },
            { icon: "✉", title: "Automated Email Dispatch", desc: "Deliver synthesized executive briefings directly to leadership and team email addresses with 1 click.", action: "Send to Email" },
            { icon: "📊", title: "Excel Multi-Sheet (.xlsx)", desc: "Full multi-tab workbook with raw data, computed statistics, cleaning log, and regression forecasting.", action: "Download Spreadsheet" },
            { icon: "📑", title: "PowerPoint Presentation (.pptx)", desc: "Formatted presentation slides ready for executive meetings, board reviews, and quarterly business reviews.", action: "Export Slides" }
          ].map(r => (
            <div
              key={r.title}
              style={{
                background: "var(--bg-primary, #F8FAFC)",
                border: "1px solid var(--border-color, #E2E8F0)",
                borderRadius: 12,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 6 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", lineHeight: 1.5, marginBottom: 14 }}>{r.desc}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#2563EB" }}>
                ✓ {r.action}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: "center",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 14,
          padding: "24px 20px",
          color: "#FFFFFF"
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, fontFamily: "var(--font-heading, 'Manrope', sans-serif)" }}>
            Generate Reports from Any Active Dataset
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", maxWidth: 500, margin: "0 auto 16px auto", lineHeight: 1.5 }}>
            Open any dataset in the workspace, navigate to <strong>Stage 09 Executive Report</strong> or click <strong>⬇ Download Report</strong> in the top toolbar to generate and dispatch your report.
          </div>
          <button
            onClick={onOpen}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "11px 26px",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37,99,235,0.35)"
            }}
          >
            → Open AI Analyst Workspace
          </button>
        </div>
      </div>

      {/* Dispatched & Downloaded Reports Ledger */}
      {savedReports.length > 0 && (
        <div style={{
          background: "var(--bg-secondary, #FFFFFF)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary, #0F172A)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            🕒 Report Activity & Dispatch History
          </div>
          <div style={{
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 12,
            overflow: "hidden"
          }}>
            {savedReports.map((r, i) => (
              <div
                key={r.id || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: i < savedReports.length - 1 ? "1px solid var(--border-color, #E2E8F0)" : "none",
                  background: i % 2 === 0 ? "var(--bg-secondary, #FFFFFF)" : "var(--bg-primary, #F8FAFC)",
                  fontSize: 13
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{r.action.includes("Email") ? "✉" : "💾"}</span>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>{r.action}</span>
                    <span style={{ color: "var(--text-secondary, #64748B)", marginLeft: 8 }}>({r.datasetName})</span>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted, #94A3B8)", marginTop: 2 }}>{r.size}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#2563EB" }}>{r.target}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted, #94A3B8)", marginTop: 2 }}>{r.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
