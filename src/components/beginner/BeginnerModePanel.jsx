// src/components/beginner/BeginnerModePanel.jsx
import React, { useState } from "react";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";
import { useLanguage } from "../../utils/i18n";

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
  const { t } = useLanguage();
  const { roleConfig } = useRole();
  const { activeDataset, activeRows } = useDataset();

  const [showGlossary, setShowGlossary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const rowsCount = activeRows ? activeRows.length : 0;
  const isDataLoaded = !!activeDataset && rowsCount > 0;
  const isPrivacyChecked = isDataLoaded && localStorage.getItem("aida_privacy_rules") !== null;

  const steps = [
    {
      num: 1,
      title: t("step_connect_data", "Connect Data"),
      desc: isDataLoaded
        ? `${activeDataset.name || "Dataset"} connected (${rowsCount.toLocaleString()} verified rows).`
        : "Upload an Excel, CSV file, or start with demo data to unlock analytics.",
      isDone: isDataLoaded,
      actionLabel: isDataLoaded ? "Inspect Structure" : t("btn_upload_dataset", "Upload Dataset"),
      action: () => {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
      }
    },
    {
      num: 2,
      title: t("step_quality_privacy", "Data Quality & Privacy Check"),
      desc: "Verify data cleanliness, missing cell rates, and ensure no customer PII is leaked.",
      isDone: isPrivacyChecked,
      actionLabel: t("btn_inspect_quality", "Check Health & Privacy"),
      action: () => {
        if (onOpenPrivacy) onOpenPrivacy();
        else if (onOpenHealth) onOpenHealth();
      }
    },
    {
      num: 3,
      title: t("step_explore_trends", "Explore Visual Trends"),
      desc: "Review interactive BI charts, category distributions, and real-time slicers.",
      isDone: isDataLoaded && isPrivacyChecked,
      actionLabel: t("btn_explain_charts", "Explain My Charts"),
      action: () => onAskCopilot && onAskCopilot("Explain the primary trend and key takeaway from our dashboard charts in plain English.")
    },
    {
      num: 4,
      title: t("step_ask_questions", "Ask Plain-English Questions"),
      desc: "Chat with the AI Copilot to investigate margins, anomalies, and drivers without formulas.",
      isDone: false,
      actionLabel: t("btn_ask_copilot", "Ask Copilot"),
      action: () => onAskCopilot && onAskCopilot(`What are the top 3 priorities for a ${roleConfig?.shortName || "Executive"} based on this dataset?`)
    },
    {
      num: 5,
      title: t("step_exec_report", "Generate Executive Report"),
      desc: "Create an audited, board-ready executive PDF summary to share with leadership.",
      isDone: false,
      actionLabel: t("btn_generate_report", "Generate PDF Report"),
      action: onExportReport
    }
  ];

  // Determine single recommended next action: first incomplete step
  const activeStep = steps.find(s => !s.isDone) || steps[steps.length - 1];

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
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
      boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
      fontFamily: "var(--font-sans, sans-serif)"
    }}>
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#ECFDF5",
            color: "#059669",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16
          }}>
            🌱
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                {t("lbl_beginner_guided_mode", "Beginner Guided Mode")}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#E0F2FE", color: "#0369A1" }}>
                {roleConfig?.title || "Executive Perspective"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-muted, #64748B)" }}>
              {t("beginner_subtitle", "One clear recommended action at each stage • Plain English without formulas")}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowGlossary(!showGlossary)}
          style={{
            background: "var(--bg-secondary, #F8FAFC)",
            border: "1px solid var(--border-color, #CBD5E1)",
            borderRadius: 8,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary, #334155)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <span>{t("glossary_btn", "📖 Plain-English Glossary")}</span>
        </button>
      </div>

      {/* 🎯 Hero Spotlight: Single Recommended Next Action */}
      <div style={{
        background: "linear-gradient(135deg, #F0FDF4 0%, #EFF6FF 100%)",
        border: "1.5px solid #86EFAC",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 14,
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 260 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#10B981",
            color: "#FFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
          }}>
            {activeStep.num === 1 ? "📁" : activeStep.num === 2 ? "🛡️" : activeStep.num === 3 ? "📊" : activeStep.num === 4 ? "🤖" : "📑"}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#047857", marginBottom: 2 }}>
              {/* Recommended Next Action • Step */}
              🎯 {t("lbl_recommended_next_action", "Recommended Next Action")} • Step {activeStep.num} of 5
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 2 }}>
              {activeStep.title}
            </div>
            <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.4 }}>
              {activeStep.desc}
            </div>
          </div>
        </div>

        <button
          onClick={activeStep.action}
          style={{
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            background: "#0F172A",
            color: "#FFFFFF",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.15)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s ease"
          }}
        >
          <span>{activeStep.actionLabel}</span>
          <span>➔</span>
        </button>
      </div>

      {/* 5-Step Compact Horizontal Progress Stepper */}
      <div style={{
        background: "var(--bg-secondary, #F8FAFC)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        overflowX: "auto"
      }}>
        {steps.map(step => {
          const isCurrent = step.num === activeStep.num;
          return (
            <div
              key={step.num}
              onClick={() => step.isDone && step.action()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                cursor: step.isDone ? "pointer" : "default",
                opacity: step.isDone ? 1 : (isCurrent ? 1 : 0.6),
                padding: "4px 8px",
                borderRadius: 6,
                background: isCurrent ? "#FFFFFF" : "transparent",
                border: isCurrent ? "1px solid #CBD5E1" : "1px solid transparent",
                fontWeight: isCurrent ? 700 : 500,
                color: step.isDone ? "#166534" : (isCurrent ? "#0F172A" : "#64748B"),
                whiteSpace: "nowrap"
              }}
            >
              <span>{step.isDone ? "✅" : isCurrent ? "▶" : "○"}</span>
              <span>{step.num}. {step.title}</span>
            </div>
          );
        })}
      </div>

      {/* Subtle Starter Question Quick-Prompts when data is active */}
      {isDataLoaded && (
        <div style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 11.5,
          color: "var(--text-muted, #64748B)"
        }}>
          <span style={{ fontWeight: 600 }}>💡 Try asking:</span>
          {roleStarterQuestions.slice(0, 2).map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskCopilot && onAskCopilot(q)}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-color, #CBD5E1)",
                borderRadius: 16,
                padding: "3px 10px",
                fontSize: 11,
                color: "var(--text-primary, #1E293B)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      )}

      {/* Searchable Glossary Drawer/Modal */}
      {showGlossary && (
        <div style={{
          marginTop: 14,
          padding: 14,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 10
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
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
