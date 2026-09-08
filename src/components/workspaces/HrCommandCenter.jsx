import React, { useState } from "react";
import { getRoleConfig } from "../../config/roleConfigs";

export default function HrCommandCenter({ onAskQuestion }) {
  const config = getRoleConfig("hr");
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onAskQuestion) {
      onAskQuestion(query);
      setQuery("");
    }
  };

  const deptMetrics = [
    { dept: "Engineering", headcount: 142, turnover: "11.2%", status: "warning" },
    { dept: "Sales & Mktg", headcount: 118, turnover: "9.4%", status: "warning" },
    { dept: "Customer Ops", headcount: 94, turnover: "6.1%", status: "positive" },
    { dept: "Product & Design", headcount: 56, turnover: "4.2%", status: "positive" },
    { dept: "Finance & Admin", headcount: 76, turnover: "3.8%", status: "positive" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)",
        color: "#FFFFFF",
        padding: "24px 28px",
        borderRadius: "14px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#A5B4FC", marginBottom: "4px" }}>
              👥 HR WORKSPACE
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 6px 0" }}>
              HR Command Center
            </h1>
            <p style={{ fontSize: "14px", color: "#C7D2FE", margin: 0 }}>
              {config.aiBrief.greeting}
            </p>
          </div>
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#EEF2FF"
          }}>
            Retention Index: <span style={{ color: "#38BDF8", fontWeight: 700 }}>91.6%</span>
          </div>
        </div>
      </div>

      {/* HR KPI Cards */}
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
                color: kpi.status === "positive" ? "#166534" : kpi.status === "warning" ? "#9A3412" : "#475569",
                backgroundColor: kpi.status === "positive" ? "#DCFCE7" : kpi.status === "warning" ? "#FFEDD5" : "#F1F5F9",
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

      {/* Department Turnover Breakdown Table */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "12px",
        padding: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
            🏢 Department Turnover & Headcount
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>QTD Tracking</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px 12px" }}>Department</th>
                <th style={{ padding: "8px 12px" }}>Active Headcount</th>
                <th style={{ padding: "8px 12px" }}>Quarterly Turnover %</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {deptMetrics.map((d, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{d.dept}</td>
                  <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{d.headcount}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: d.status === "warning" ? "#C2410C" : "#15803D" }}>{d.turnover}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      background: d.status === "warning" ? "#FFEDD5" : "#DCFCE7",
                      color: d.status === "warning" ? "#9A3412" : "#166534"
                    }}>
                      {d.status === "warning" ? "Needs Attention" : "Stable"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR AI Assistant Prompt Box */}
      <div style={{
        backgroundColor: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: "14px",
        padding: "20px"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
          💬 Ask your HR AI Assistant anything...
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Which department has the highest attrition?"
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
              background: "#4F46E5",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer"
            }}
          >
            Ask HR AI →
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
