import React from "react";
import { ROLE_CONFIGS } from "../../config/roleConfigs";

export default function RoleSelectionModal({ activeRole, onSelectRole, onClose }) {
  const rolesList = [
    { id: "ceo", name: "👔 CEO / Executive", desc: "High-level metrics & strategic decisions" },
    { id: "hr", name: "👥 HR Manager", desc: "Workforce headcount, turnover & retention" },
    { id: "recruiter", name: "🎯 Recruiter", desc: "Candidate pipeline & hiring time" },
    { id: "finance", name: "💰 Finance", desc: "Revenue, expenses & budget variance" },
    { id: "data_analyst", name: "📊 Data Analyst", desc: "Full BI suite, SQL & ML modeling" },
    { id: "data_scientist", name: "🤖 Data Scientist", desc: "Advanced predictive ML & forecasting" },
    { id: "sales", name: "📈 Sales", desc: "Pipeline velocity & deal forecasting" },
    { id: "marketing", name: "📣 Marketing", desc: "Campaign ROI & lead acquisition" },
    { id: "operations", name: "⚙️ Operations", desc: "Process bottlenecks & inventory" },
    { id: "it", name: "💻 IT / Technology", desc: "System uptime & incident resolution" },
    { id: "supply_chain", name: "🚚 Supply Chain", desc: "Logistics tracking & supplier metrics" },
    { id: "admin", name: "🛡️ Administrator", desc: "System security & permission governance" }
  ];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "var(--bg-primary, #FFFFFF)",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        width: "100%",
        maxWidth: "680px",
        padding: "32px",
        boxSizing: "border-box",
        border: "1px solid var(--border-color, #E2E8F0)",
        fontFamily: "var(--font-sans, sans-serif)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--accent-color, #2563EB)", marginBottom: "6px" }}>
            🤖 AI BUSINESS COPILOT
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
            What is your role?
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary, #64748B)", margin: 0 }}>
            Select your workspace. The AI will adapt its tools, dashboards, and answers to your domain.
          </p>
        </div>

        {/* Role Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "12px",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "4px",
          marginBottom: "24px"
        }}>
          {rolesList.map(r => {
            const isSelected = activeRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => onSelectRole(r.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #2563EB" : "1px solid var(--border-color, #E2E8F0)",
                  background: isSelected ? "rgba(37, 99, 235, 0.06)" : "var(--bg-secondary, #F8FAFC)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: 700, color: isSelected ? "#1E40AF" : "var(--text-primary, #0F172A)" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted, #64748B)", marginTop: "2px" }}>
                  {r.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action button */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #CBD5E1)",
                background: "transparent",
                color: "var(--text-primary, #0F172A)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#2563EB",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
            }}
          >
            Continue to Workspace →
          </button>
        </div>
      </div>
    </div>
  );
}
