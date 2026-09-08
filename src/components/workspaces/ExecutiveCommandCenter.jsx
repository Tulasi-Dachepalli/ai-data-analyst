import React, { useState } from "react";
import { getRoleConfig } from "../../config/roleConfigs";

export default function ExecutiveCommandCenter({ onAskQuestion }) {
  const config = getRoleConfig("ceo");
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onAskQuestion) {
      onAskQuestion(query);
      setQuery("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#FFFFFF",
        padding: "24px 28px",
        borderRadius: "14px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#60A5FA", marginBottom: "4px" }}>
              👔 EXECUTIVE WORKSPACE
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0" }}>
              Executive Command Center
            </h1>
            <p style={{ fontSize: "14px", color: "#94A3B8", margin: 0 }}>
              {config.aiBrief.greeting}
            </p>
          </div>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#E2E8F0"
          }}>
            Status: <span style={{ color: "#4ADE80", fontWeight: 700 }}>🟢 Business Healthy</span>
          </div>
        </div>
      </div>

      {/* 5–7 Executive KPI Cards Grid */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "12px" }}>
          Key Business Performance Metrics
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "14px"
        }}>
          {config.kpiCards.map((kpi, idx) => (
            <div key={idx} style={{
              backgroundColor: "var(--bg-secondary, #F8FAFC)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--text-muted, #64748B)" }}>
                {kpi.title}
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                {kpi.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px" }}>
                <span style={{
                  fontWeight: 700,
                  color: kpi.status === "positive" ? "#166534" : kpi.status === "warning" ? "#9A3412" : "#475569",
                  backgroundColor: kpi.status === "positive" ? "#DCFCE7" : kpi.status === "warning" ? "#FFEDD5" : "#F1F5F9",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {kpi.trend}
                </span>
                <span style={{ color: "var(--text-muted, #94A3B8)", fontSize: "11px" }}>
                  {kpi.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: AI Executive Brief & Needs Attention */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
        
        {/* AI Executive Brief */}
        <div style={{
          backgroundColor: "var(--bg-secondary, #F8FAFC)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🧠</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              AI Executive Brief
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {config.aiBrief.highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", lineHeight: "1.5" }}>
                <span>{h.type === "positive" ? "🟢" : h.type === "warning" ? "🟡" : "🔴"}</span>
                <span style={{ color: "var(--text-primary)" }}>{h.text}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "6px",
            padding: "10px 14px",
            backgroundColor: "rgba(37, 99, 235, 0.06)",
            borderLeft: "4px solid #2563EB",
            borderRadius: "4px",
            fontSize: "12.5px"
          }}>
            <strong>Recommended Action:</strong> {config.aiBrief.recommendedAction}
          </div>
        </div>

        {/* Needs Attention Alert Box */}
        <div style={{
          backgroundColor: "var(--bg-secondary, #F8FAFC)",
          border: "1px solid var(--border-color, #E2E8F0)",
          borderRadius: "12px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🔴</span>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Needs Attention
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {config.needsAttention.map((item, i) => (
              <div key={i} style={{
                padding: "10px 12px",
                border: "1px solid #FECDD3",
                backgroundColor: "#FFF1F2",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#9F1239" }}>{item.area}</div>
                  <div style={{ fontSize: "11.5px", color: "#881337" }}>{item.metric}</div>
                </div>
                <button
                  onClick={() => onAskQuestion && onAskQuestion(`Analyze ${item.area}`)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#E11D48",
                    color: "#FFF",
                    cursor: "pointer"
                  }}
                >
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive AI Prompt Input Box */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "14px",
        padding: "20px"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          💬 Ask your Executive AI Copilot anything...
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Why is revenue down in the South region?"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #CBD5E1)",
              fontSize: "13.5px",
              backgroundColor: "var(--bg-primary, #FFFFFF)",
              color: "var(--text-primary, #0F172A)",
              outline: "none"
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2563EB",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer"
            }}
          >
            Ask Executive AI →
          </button>
        </form>

        {/* Quick Sample Questions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>Try asking:</span>
          {config.sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskQuestion && onAskQuestion(q)}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "16px",
                border: "1px solid var(--border-color, #E2E8F0)",
                background: "var(--bg-primary, #FFFFFF)",
                color: "var(--text-secondary, #475569)",
                cursor: "pointer"
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
