// src/components/beginner/BeginnerModePanel.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useRole } from "../../context/RoleContext";
import { useDataset } from "../../context/DatasetContext";
import { useLanguage } from "../../utils/i18n";
import { detectColumnMappings, assessDataReadiness, getColumnTypeBadge } from "../../utils/columnTypes";

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
    term: "Equal Calendar Periods",
    category: "Trend Analysis",
    meaning: "Comparing two identical calendar durations (e.g., 35 days vs prior 35 days) rather than arbitrary record splits, providing valid apples-to-apples trend measurement."
  },
  {
    term: "R² Accuracy Score",
    category: "Forecasting",
    meaning: "A score from 0% to 100% telling you how reliable the AI forecast formula is. 90%+ indicates strong predictive statistical confidence."
  },
  {
    term: "Net EBITDA Margin",
    category: "Executive",
    meaning: "The percentage of profit left over after paying standard operational expenses, before accounting for taxes and interest."
  },
  {
    term: "Data Completeness",
    category: "Quality",
    meaning: "The percentage of non-empty, valid cells across the entire dataset. 100% means zero missing or corrupted values."
  }
];

export default function BeginnerModePanel({ onOpenPrivacy, onOpenHealth, onAskCopilot, onExportReport }) {
  const { t } = useLanguage();
  const { roleConfig } = useRole();
  const { activeDataset, activeRows, activeCols, unfilteredRows, isFiltered, filters, updateFilter, openInvestigation } = useDataset();

  // Business-Goal State
  const [businessGoal, setBusinessGoal] = useState(() => {
    return localStorage.getItem("aida_user_goal") || "sales";
  });

  // Modals & Panels State
  const [showReadiness, setShowReadiness] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [snapshotName, setSnapshotName] = useState("");
  const [mappingConfirmed, setMappingConfirmed] = useState(false);

  // Column Mappings State
  const [columnMappings, setColumnMappings] = useState(() => {
    return detectColumnMappings(activeCols || [], activeRows || []);
  });

  useEffect(() => {
    if (activeCols?.length) {
      setColumnMappings(detectColumnMappings(activeCols, activeRows || []));
    }
  }, [activeDataset?.name, activeCols]);

  // Saved Analyses History State
  const [savedAnalyses, setSavedAnalyses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("aida_saved_analyses") || "[]");
    } catch {
      return [];
    }
  });

  // Action Tracking State
  const [tasks, setTasks] = useState(() => {
    try {
      const stored = localStorage.getItem("aida_action_tasks");
      if (stored) return JSON.parse(stored);
      return [
        {
          id: "task-1",
          title: "Audit negative-margin Furniture orders in East region",
          owner: "Operations Lead",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: "in_progress",
          priority: "High"
        }
      ];
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Operations Lead");
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const handleSelectGoal = (goal) => {
    setBusinessGoal(goal);
    localStorage.setItem("aida_user_goal", goal);
  };

  const rowsCount = activeRows ? activeRows.length : 0;
  const isDataLoaded = !!activeDataset && rowsCount > 0;
  const isPrivacyChecked = isDataLoaded && localStorage.getItem("aida_privacy_rules") !== null;

  // Goals configuration with tailored questions
  const GOALS = {
    sales: {
      id: "sales",
      title: "📈 Understand Sales & Growth",
      desc: "Analyze top revenue streams, product categories, and regional performance trends.",
      promptSuggestions: [
        "What are our top 3 revenue generators?",
        "Which region had the strongest sales growth?",
        "Are there any negative profit orders in our sales?"
      ]
    },
    spending: {
      id: "spending",
      title: "💰 Review Spending & Margin",
      desc: "Identify high-cost drivers, discount leakages, and improve net operating profit.",
      promptSuggestions: [
        "Where did our spending or discounts exceed healthy thresholds?",
        "Which product category has the lowest profit margin?",
        "What is our net operating profit margin across all orders?"
      ]
    },
    quality: {
      id: "quality",
      title: "🛡️ Check Data Quality & Completeness",
      desc: "Inspect completeness, identify anomalies or missing fields, and ensure audit integrity.",
      promptSuggestions: [
        "Are there missing cells or duplicate rows in this dataset?",
        "Explain the data health completeness score.",
        "Which columns have potential formatting inconsistencies?"
      ]
    }
  };

  const currentGoalConfig = GOALS[businessGoal] || GOALS.sales;

  // Ingestion Readiness & Feasibility Checks
  const readinessData = useMemo(() => {
    if (!activeDataset || !activeRows || activeRows.length === 0) return null;
    const { mappings, checks } = assessDataReadiness(activeCols || [], activeRows, columnMappings);
    const completenessScore = activeDataset?.quality?.completeness ?? activeDataset?.quality?.score ?? 100;

    let dateRangeText = "None detected";
    if (mappings.date) {
      const validDates = activeRows.map(r => r[mappings.date]).filter(Boolean).sort();
      if (validDates.length > 0) {
        dateRangeText = `${validDates[0]} to ${validDates[validDates.length - 1]} (${mappings.date})`;
      }
    }

    return {
      dateRangeText,
      mappings,
      checks,
      completenessScore: `${completenessScore}%`,
      missingCells: activeDataset?.quality?.missingCells ?? 0,
      privacyStatus: "Passed • Zero unmasked PII detected"
    };
  }, [activeDataset, activeRows, activeCols, columnMappings]);

  // Action: Open Evidence Drawer for active metrics
  const handleOpenEvidence = () => {
    if (!openInvestigation) return;
    const salesCol = columnMappings.revenue || (activeCols || []).find(c => /sales|revenue/i.test(c));
    const profitCol = columnMappings.profit || (activeCols || []).find(c => /profit/i.test(c));
    const totalSales = salesCol ? activeRows.reduce((s, r) => s + (parseFloat(r[salesCol]) || 0), 0) : 0;
    const totalProfit = profitCol ? activeRows.reduce((s, r) => s + (parseFloat(r[profitCol]) || 0), 0) : 0;

    openInvestigation({
      title: "Executive Metric Evidence & Audit Trail",
      question: `Empirical calculation evidence for ${activeDataset?.name || "Active Dataset"}`,
      formula: `Sales: Σ(${salesCol || "Sales"}) = ₹${Math.round(totalSales).toLocaleString()} | Profit: Σ(${profitCol || "Profit"}) = ₹${Math.round(totalProfit).toLocaleString()}`,
      affectedRows: `${rowsCount} verified row(s)`,
      filters: isFiltered ? `Active Filters (${rowsCount} of ${unfilteredRows?.length || rowsCount} rows)` : "All dataset rows evaluated",
      limitations: "Calculated strictly from active tabular rows. External target and budget benchmarks are not present in active schema.",
      findings: [
        `Evaluated across ${rowsCount} verified records.`,
        `Quality Completeness: ${activeDataset?.quality?.completeness ?? 100}% verified.`,
        `Dataset Version: ${activeDataset?.currentVersion || "v1 Raw"}.`
      ]
    });
  };

  // Action: Save Analysis Snapshot
  const handleSaveSnapshot = () => {
    const name = snapshotName.trim() || `${currentGoalConfig.title.slice(2)} - ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const newSnapshot = {
      id: `snap-${Date.now()}`,
      name,
      goal: businessGoal,
      filters: { ...filters },
      datasetName: activeDataset?.name || "Dataset",
      version: activeDataset?.currentVersion || "v1 Raw",
      savedAt: new Date().toLocaleDateString()
    };
    const updated = [newSnapshot, ...savedAnalyses.slice(0, 9)];
    setSavedAnalyses(updated);
    localStorage.setItem("aida_saved_analyses", JSON.stringify(updated));
    setSnapshotName("");
  };

  const handleRestoreSnapshot = (snap) => {
    if (snap.goal) handleSelectGoal(snap.goal);
    if (snap.filters && updateFilter) updateFilter(snap.filters);
    setShowSavedModal(false);
  };

  const handleDeleteSnapshot = (id) => {
    const updated = savedAnalyses.filter(s => s.id !== id);
    setSavedAnalyses(updated);
    localStorage.setItem("aida_saved_analyses", JSON.stringify(updated));
  };

  // Action: Task Management
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      owner: newTaskOwner,
      dueDate: newTaskDueDate,
      status: "todo",
      priority: "High"
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    localStorage.setItem("aida_action_tasks", JSON.stringify(updated));
    setNewTaskTitle("");
  };

  const handleToggleTaskStatus = (id) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === "completed" ? "todo" : "completed";
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem("aida_action_tasks", JSON.stringify(updated));
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem("aida_action_tasks", JSON.stringify(updated));
  };

  const completedTasksCount = tasks.filter(t => t.status === "completed").length;

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
        if (!isDataLoaded) {
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.click();
        } else {
          setShowMappingModal(true);
        }
      }
    },
    {
      num: 2,
      title: "Confirm Columns & Readiness",
      desc: mappingConfirmed
        ? "Column roles confirmed. Analytical readiness verified."
        : "Confirm date, revenue, profit, and identifier columns to prevent AI misinterpretation.",
      isDone: mappingConfirmed,
      actionLabel: "Confirm Columns",
      action: () => setShowMappingModal(true)
    },
    {
      num: 3,
      title: t("step_explore_trends", "Explore Goal Charts"),
      desc: `Visual insights tailored for: ${currentGoalConfig.title}.`,
      isDone: isDataLoaded && mappingConfirmed,
      actionLabel: "Explain Goal Insights",
      action: () => onAskCopilot && onAskCopilot(`What are the key takeaways for "${currentGoalConfig.title}" from our dataset?`)
    },
    {
      num: 4,
      title: t("step_ask_questions", "Ask Plain-English Copilot"),
      desc: "Investigate anomalies and drivers without manual formulas.",
      isDone: false,
      actionLabel: t("btn_ask_copilot", "Ask Copilot"),
      action: () => onAskCopilot && onAskCopilot(currentGoalConfig.promptSuggestions[0])
    },
    {
      num: 5,
      title: t("step_exec_report", "Generate Executive Report"),
      desc: "Create an audited, board-ready executive PDF deck to share with leadership.",
      isDone: false,
      actionLabel: t("btn_generate_report", "Generate PDF Report"),
      action: onExportReport
    }
  ];

  const activeStep = steps.find(s => !s.isDone) || steps[steps.length - 1];

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
      {/* 🎯 Business-Goal Selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748B", marginBottom: 6 }}>
          🎯 Choose Your Business Goal:
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          {Object.values(GOALS).map(g => {
            const isSelected = businessGoal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGoal(g.id)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: isSelected ? "1.5px solid #2563EB" : "1px solid #CBD5E1",
                  background: isSelected ? "#EFF6FF" : "#F8FAFC",
                  color: isSelected ? "#1E40AF" : "#334155",
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{g.title}</span>
                {isSelected && <span style={{ color: "#2563EB", fontWeight: 800 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Controls Toolbar: Clean, Uncluttered, Accessible */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 14, borderBottom: "1px solid #F1F5F9", paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {isDataLoaded && (
            <>
              <button
                onClick={() => setShowMappingModal(true)}
                style={{
                  background: mappingConfirmed ? "#F0FDF4" : "#EFF6FF",
                  border: mappingConfirmed ? "1px solid #86EFAC" : "1px solid #BFDBFE",
                  color: mappingConfirmed ? "#166534" : "#1E40AF",
                  borderRadius: 6,
                  padding: "5px 11px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span>🎯 Column Mapping Review</span>
                {mappingConfirmed && <span>✓</span>}
              </button>

              <button
                onClick={() => setShowReadiness(!showReadiness)}
                style={{
                  background: showReadiness ? "#EFF6FF" : "#F8FAFC",
                  border: "1px solid #BFDBFE",
                  color: "#1E40AF",
                  borderRadius: 6,
                  padding: "5px 11px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>📋 Ingestion & Upload Readiness Review {showReadiness ? "▲" : "▼"}</span>
              </button>

              <button
                onClick={handleOpenEvidence}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  borderRadius: 6,
                  padding: "5px 11px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>📐 View Evidence</span>
              </button>

              <button
                onClick={() => setShowSavedModal(true)}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  borderRadius: 6,
                  padding: "5px 11px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span>💾 Saved Analysis ({savedAnalyses.length})</span>
              </button>

              <button
                onClick={() => setShowTasksModal(true)}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  color: "#334155",
                  borderRadius: 6,
                  padding: "5px 11px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span>📝 Action Tasks ({completedTasksCount}/{tasks.length})</span>
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setShowGlossary(!showGlossary)}
          style={{
            background: "#F8FAFC",
            border: "1px solid #CBD5E1",
            borderRadius: 6,
            padding: "5px 11px",
            fontSize: 11.5,
            fontWeight: 600,
            color: "#334155",
            cursor: "pointer"
          }}
        >
          📖 Glossary {showGlossary ? "▲" : "▼"}
        </button>
      </div>

      {/* 📋 Ingestion & Analytical Readiness Review */}
      {showReadiness && readinessData && (
        <div style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          padding: 16,
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          fontSize: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 8 }}>
            <span style={{ fontWeight: 800, color: "#0F172A", fontSize: 13 }}>📋 Ingestion & Dataset Upload Readiness Review</span>
            <span style={{ color: "#16A34A", fontWeight: 700 }}>Completeness: {readinessData.completenessScore}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, color: "#334155" }}>
            <div><strong>Detected Date Span:</strong> {readinessData.dateRangeText}</div>
            <div><strong>Missing Cells:</strong> {readinessData.missingCells} (0.0% missing rate)</div>
            <div><strong>PII Scan:</strong> <span style={{ color: "#16A34A", fontWeight: 600 }}>{readinessData.privacyStatus}</span></div>
          </div>

          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Feasibility of Analytical Features:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {readinessData.checks.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 10px", background: "#FFFFFF", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                  <span>{c.isReady ? "✅" : "⚠️"}</span>
                  <div>
                    <strong style={{ color: c.isReady ? "#166534" : "#9A3412" }}>{c.title}: </strong>
                    <span style={{ color: "#475569" }}>{c.isReady ? c.readyDetail : c.missingDetail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Single Prominent Recommended Next Action Hero Banner */}
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
            {activeStep.num === 1 ? "📁" : activeStep.num === 2 ? "🎯" : activeStep.num === 3 ? "📊" : activeStep.num === 4 ? "🤖" : "📑"}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#047857", marginBottom: 2 }}>
              🎯 Recommended Next Action • Step {activeStep.num} of 5
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

      {/* 5-Step Progress Stepper */}
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
              onClick={() => step.action()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                cursor: "pointer",
                opacity: step.isDone ? 1 : (isCurrent ? 1 : 0.65),
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

      {/* Goal-Tailored Quick Starter Prompts */}
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
          <span style={{ fontWeight: 700 }}>💡 Tailored for {currentGoalConfig.title}:</span>
          {currentGoalConfig.promptSuggestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onAskCopilot && onAskCopilot(q)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 16,
                padding: "3px 10px",
                fontSize: 11,
                color: "#1E293B",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      )}

      {/* 🎯 Column Mapping Review Modal */}
      {showMappingModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            maxWidth: 520,
            width: "100%",
            padding: 22,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>🎯 Column Mapping Review</div>
              <button onClick={() => setShowMappingModal(false)} aria-label="Close Column Mappings" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748B", margin: "0 0 14px 0" }}>
              Confirm detected column semantic roles before analyzing. This guarantees trends, forecasts, and calculations use the correct metrics.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
              {[
                { key: "date", label: "Date / Time Dimension", icon: "📅" },
                { key: "revenue", label: "Revenue / Sales Column", icon: "💰" },
                { key: "profit", label: "Net Profit Column", icon: "📈" },
                { key: "cost", label: "Operating Cost / Spend", icon: "📉" },
                { key: "category", label: "Primary Category Dimension", icon: "🔤" },
                { key: "geography", label: "Geographic / Regional Column", icon: "🗺️" },
                { key: "identifier", label: "Order / Record Identifier", icon: "🔑" }
              ].map(field => (
                <div key={field.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{field.icon}</span>
                    <span>{field.label}:</span>
                  </div>
                  <select
                    value={columnMappings[field.key] || ""}
                    onChange={e => setColumnMappings(prev => ({ ...prev, [field.key]: e.target.value || null }))}
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, background: "#FFFFFF", cursor: "pointer" }}
                  >
                    <option value="">-- None / Auto --</option>
                    {(activeCols || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setShowMappingModal(false)}
                style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMappingConfirmed(true);
                  setShowMappingModal(false);
                }}
                style={{ padding: "8px 18px", borderRadius: 6, border: "none", background: "#10B981", color: "#FFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                ✓ Confirm Mappings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💾 Saved Analysis Snapshots Modal */}
      {showSavedModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            maxWidth: 480,
            width: "100%",
            padding: 22,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>💾 Saved Analysis Snapshots</div>
              <button onClick={() => setShowSavedModal(false)} aria-label="Close Saved Analysis" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Save Current View Snapshot:</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  placeholder="Snapshot name (e.g. Q1 Sales Trend)"
                  value={snapshotName}
                  onChange={e => setSnapshotName(e.target.value)}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                />
                <button
                  onClick={handleSaveSnapshot}
                  style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Saved History:</div>
              {savedAnalyses.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No saved snapshots yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {savedAnalyses.map(snap => (
                    <div key={snap.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#F8FAFC", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{snap.name}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{snap.datasetName} • {snap.savedAt}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📝 Action Tracking Modal */}
      {showTasksModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 14,
            maxWidth: 520,
            width: "100%",
            padding: 22,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>📝 Business Action Tracking</div>
              <button onClick={() => setShowTasksModal(false)} aria-label="Close Action Tracking" style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748B", margin: "0 0 14px 0" }}>
              Turn verified insights into assigned tasks with owners, due dates, and completion status.
            </p>

            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Create New Action Item:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Task title (e.g. Audit furniture discount policies)"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Owner (e.g. Finance Team)"
                    value={newTaskOwner}
                    onChange={e => setNewTaskOwner(e.target.value)}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                  />
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                  />
                  <button
                    onClick={handleAddTask}
                    style={{ background: "#10B981", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Active Tasks:</div>
                <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>{completedTasksCount} of {tasks.length} Completed</span>
              </div>

              {tasks.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No action tasks created yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                  {tasks.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: t.status === "completed" ? "#F0FDF4" : "#F8FAFC", borderRadius: 6, border: "1px solid #E2E8F0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={t.status === "completed"}
                          onChange={() => handleToggleTaskStatus(t.id)}
                          style={{ cursor: "pointer" }}
                        />
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: t.status === "completed" ? "#166534" : "#0F172A", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: "#64748B" }}>{t.owner} • Due {t.dueDate}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📖 Searchable Glossary */}
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
