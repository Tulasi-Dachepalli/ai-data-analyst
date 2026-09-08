import React, { useState } from "react";
import { getRoleConfig } from "../../config/roleConfigs";

export default function RecruitmentCommandCenter({ onAskQuestion }) {
  const config = getRoleConfig("recruiter");
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
        background: "linear-gradient(135deg, #047857 0%, #064E3B 100%)",
        color: "#FFFFFF",
        padding: "24px 28px",
        borderRadius: "14px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#6EE7B7", marginBottom: "4px" }}>
              🎯 RECRUITMENT WORKSPACE
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0" }}>
              Recruitment Command Center
            </h1>
            <p style={{ fontSize: "14px", color: "#A7F3D0", margin: 0 }}>
              {config.aiBrief.greeting}
            </p>
          </div>
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#ECFDF5"
          }}>
            Hiring Target: <span style={{ color: "#34D399", fontWeight: 700 }}>82% Accepted</span>
          </div>
        </div>
      </div>

      {/* Recruiter KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted, #64748B)" }}>
              {kpi.title}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              {kpi.value}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
              <span style={{
                fontWeight: 700,
                color: kpi.status === "positive" ? "#166534" : "#475569",
                backgroundColor: kpi.status === "positive" ? "#DCFCE7" : "#F1F5F9",
                padding: "2px 6px",
                borderRadius: "4px"
              }}>
                {kpi.trend}
              </span>
              <span style={{ color: "var(--text-muted, #94A3B8)" }}>{kpi.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Needs Attention Hiring Delays Table */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "12px",
        padding: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <span style={{ fontSize: "18px" }}>🔴</span>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Needs Attention (Hiring Delays & Feedback Bottlenecks)
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px 12px" }}>Position</th>
                <th style={{ padding: "8px 12px" }}>Current Stage</th>
                <th style={{ padding: "8px 12px" }}>Days Open</th>
                <th style={{ padding: "8px 12px" }}>Hiring Issue</th>
                <th style={{ padding: "8px 12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {config.needsAttention.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-primary)" }}>{item.position}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{item.stage}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: item.daysOpen > 30 ? "#DC2626" : "#D97706" }}>{item.daysOpen} days</td>
                  <td style={{ padding: "10px 12px", color: "#881337" }}>{item.issue}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => onAskQuestion && onAskQuestion(`Analyze candidate bottleneck for ${item.position}`)}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#059669",
                        color: "#FFF",
                        cursor: "pointer"
                      }}
                    >
                      Resolve Bottleneck →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recruiter AI Prompt Box */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "14px",
        padding: "20px"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          💬 Ask your Recruiting AI Assistant anything...
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Which positions are taking the longest to fill?"
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
              background: "#059669",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer"
            }}
          >
            Ask Recruiting AI →
          </button>
        </form>

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
