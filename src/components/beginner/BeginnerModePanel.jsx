// src/components/beginner/BeginnerModePanel.jsx
import React, { useState, useEffect } from "react";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";

const GLOSSARY_TERMS = [
  {
    term: "Revenue Variance",
    category: "Finance",
    meaning: "The difference between what you planned to earn and what you actually made. A negative variance means you earned less than expected."
  },
  {
    term: "IQR Outlier",
    category: "Data Health",
    meaning: "A data value that is wildly higher or lower than the rest of your numbers. It could be an anomaly, a billing error, or a record-breaking transaction."
  },
  {
    term: "R² Accuracy Score",
    category: "Forecasting",
    meaning: "A score from 0% to 100% telling you how reliable the AI forecast formula is. 90%+ means high confidence."
  },
  {
    term: "Net EBITDA Margin",
    category: "Executive",
    meaning: "The percentage of profit left over after paying standard operational expenses, before accounting for taxes and interest."
  },
  {
    term: "Attrition / Turnover Rate",
    category: "HR",
    meaning: "The percentage of team members or subscribers who left during a specific quarter or year."
  },
  {
    term: "Pipeline Velocity",
    category: "Recruitment",
    meaning: "How fast a prospective candidate moves from their first job application to an accepted offer letter."
  }
];

export default function BeginnerModePanel({ onOpenPrivacy, onOpenHealth, onAskCopilot, onExportReport }) {
  const { roleConfig } = useRole();
  const { activeDataset, activeRows, activeColumns } = useDataset();

  const [currentStep, setCurrentStep] = useState(() => {
    return parseInt(localStorage.getItem("aida_beginner_step") || "1", 10);
  });
  const [showGlossary, setShowGlossary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const steps = [
    {
      num: 1,
      title: "Data Connected",
      desc: activeDataset ? `${activeDataset.name || "Sales_Q3"} • ${activeRows.length} rows verified` : "Upload a CSV, Excel file, or Google Sheet",
      isDone: !!activeDataset && activeRows.length > 0,
      actionLabel: activeDataset ? "View Structure" : "Upload Data",
      action: () => window.dispatchEvent(new Event("trigger-file-upload"))
    },
    {
      num: 2,
      title: "Privacy & Quality Check",
      desc: "Check for exposed emails/salaries and inspect missing values",
      isDone: !!activeDataset && localStorage.getItem("aida_privacy_rules") !== null,
      actionLabel: "Review Privacy & PII",
      action: onOpenPrivacy
    },
    {
      num: 3,
      title: "Explore Visual Trends",
      desc: "Review automated charts and role-tailored performance KPIs",
      isDone: !!activeDataset,
      actionLabel: "Explain My Charts",
      action: () => onAskCopilot && onAskCopilot("Explain the primary trend and key takeaway from our dashboard charts in plain English.")
    },
    {
      num: 4,
      title: "Ask Natural Business Questions",
      desc: "Chat with the Copilot without writing SQL or formulas",
      isDone: false,
      actionLabel: "Ask Copilot",
      action: () => onAskCopilot && onAskCopilot(`What are the top 3 priorities for a ${roleConfig?.shortName || "Executive"} based on this dataset?`)
    },
    {
      num: 5,
      title: "Download 1-Click Executive Report",
      desc: "Export an audited board-ready summary PDF",
      isDone: false,
      actionLabel: "Generate PDF Report",
      action: onExportReport
    }
  ];

  const completedCount = steps.filter(s => s.isDone).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const roleStarterQuestions = {
    ceo: [
      "What needs my immediate executive attention this week?",
      "Which region or product had the strongest quarterly growth?",
      "Are there any emerging cost or revenue risks?"
    ],
    finance: [
      "Where did our spending exceed the budgeted amount?",
      "What are the top 3 cost drivers this quarter?",
      "Did you detect any suspicious expense anomalies?"
    ],
    hr: [
      "Which departments have the highest turnover risk?",
      "What is the average tenancy of our employees?",
      "Are salaries balanced across similar job titles?"
    ],
    recruiter: [
      "Where are candidate applications getting stuck in the pipeline?",
      "What is our average time-to-hire by position?",
      "Which hiring channels have the highest offer acceptance rate?"
    ],
    data_analyst: [
      "Which columns have the most missing values or formatting errors?",
      "Show me the correlation between price and units sold.",
      "Summarize the key statistical quartiles for revenue."
    ],
    data_scientist: [
      "What is the forecast trajectory for the next 90 days?",
      "Are there any non-linear clusters in our customer base?",
      "Evaluate regression model accuracy and residual errors."
    ]
  }[roleConfig?.id || "ceo"] || [
    "What are the key takeaways from this data?",
    "Where is our biggest opportunity for growth?",
    "Explain any unusual patterns you discovered."
  ];

  const filteredGlossary = GLOSSARY_TERMS.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
      boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "#ECFDF5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18
          }}>
            🌱
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                Beginner Guided Mode Active
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#E0F2FE", color: "#0369A1" }}>
                {roleConfig?.title || "Executive Perspective"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B" }}>
              Simplified step-by-step guidance • Complex formulas and technical jargon translated into plain English.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            style={{
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>📖</span>
            <span>Plain-English Glossary</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>
          <span>Your Guided Progress: {completedCount} of {steps.length} Steps Ready</span>
          <span style={{ color: "#2563EB", fontWeight: 700 }}>{progressPercent}% Complete</span>
        </div>
        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #10B981, #2563EB)", transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* 5-Step Journey Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 10,
        marginBottom: 16
      }}>
        {steps.map(step => (
          <div
            key={step.num}
            style={{
              border: `1px solid ${step.isDone ? "#BBF7D0" : "#E2E8F0"}`,
              background: step.isDone ? "#F0FDF4" : "#F8FAFC",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: step.isDone ? "#166534" : "#64748B" }}>
                  STEP {step.num}
                </span>
                <span style={{ fontSize: 14 }}>{step.isDone ? "✅" : "○"}</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4, marginBottom: 8 }}>
                {step.desc}
              </div>
            </div>

            <button
              onClick={step.action}
              style={{
                width: "100%",
                padding: "5px 8px",
                fontSize: 11.5,
                fontWeight: 700,
                borderRadius: 6,
                border: step.isDone ? "1px solid #86EFAC" : "none",
                background: step.isDone ? "#FFFFFF" : "#0F172A",
                color: step.isDone ? "#166534" : "#FFFFFF",
                cursor: "pointer"
              }}
            >
              {step.actionLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Role Starter Questions */}
      <div style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
          <span>💡</span>
          <span>Recommended Beginner Questions for {roleConfig?.shortName || "Executives"}:</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {roleStarterQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskCopilot && onAskCopilot(q)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 20,
                padding: "5px 12px",
                fontSize: 11.5,
                color: "#1E293B",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.color = "#2563EB"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#1E293B"; }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Searchable Glossary Drawer/Modal */}
      {showGlossary && (
        <div style={{
          marginTop: 14,
          padding: 14,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 10
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📖</span>
              <span>Data Terms Explained in Plain English</span>
            </div>
            <input
              type="text"
              placeholder="Search term (e.g. outlier, margin)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                padding: "4px 10px",
                fontSize: 11.5,
                borderRadius: 6,
                border: "1px solid #FCD34D",
                background: "#FFFFFF",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            {filteredGlossary.map((item, idx) => (
              <div key={idx} style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #FEF3C7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#78350F" }}>{item.term}</span>
                  <span style={{ fontSize: 10, color: "#B45309", background: "#FEF3C7", padding: "1px 6px", borderRadius: 4 }}>{item.category}</span>
                </div>
                <div style={{ fontSize: 11, color: "#451A03", lineHeight: 1.4 }}>{item.meaning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
