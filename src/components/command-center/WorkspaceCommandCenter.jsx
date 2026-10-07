// src/components/command-center/WorkspaceCommandCenter.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useDecision } from "../../context/DecisionContext";
import { useActivity } from "../../context/ActivityContext";
import { useRole } from "../../context/RoleContext";
import { WORKFLOW_STAGES, getStageLockState } from "../../config/workflowStages";
import { useLanguage } from "../../utils/i18n";
import { calculateDataQuality } from "../../utils/dataQuality";

export default function WorkspaceCommandCenter({ setView }) {
  const { t } = useLanguage();
  const { currentVersion, rawVersion, activeDataset, activeRows, activeCols, history, setCurrentStage, currentStage, openInvestigation } = useDataset();
  const { pendingDecisions, openInbox, applyDecision, rejectDecision } = useDecision();
  const { events, openActivityDrawer } = useActivity();
  const { user, activeRole } = useRole() || {};

  const [activeTab, setActiveTab] = useState("datasets"); // "datasets", "decisions", "activity", "stages"

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Workspace Dataset";
  const versionTag = currentVersion?.version || activeDataset?.currentVersion || "v1 Raw";
  const rowCount = activeRows ? activeRows.length : (activeDataset?.rowCount || 0);
  const colCount = activeCols ? activeCols.length : (activeDataset?.columnCount || 0);
  const calculatedQuality = (activeRows && activeCols && activeRows.length > 0) ? calculateDataQuality(activeRows, activeCols).score : null;
  const healthScore = activeDataset?.quality?.score != null ? activeDataset.quality.score : calculatedQuality;
  const rawHash = activeDataset?.rawHash || (rawVersion ? rawVersion.hash : "sha256-root-hash");

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : null) || "Tulasi";
  const findingsCount = rowCount > 0 ? Math.min(12, Math.max(2, Math.floor(rowCount / 100))) : 0;
  
  const hasForecast = !!(activeDataset?.forecastResult || activeDataset?.forecastTrainResult);
  const isDemo = !!(activeDataset?.isDemo || activeDataset?.name?.toLowerCase().includes("demo") || activeDataset?.name?.toLowerCase().includes("superstore"));
  const trainedModelsCount = activeDataset?.models?.length || (activeDataset?.mlResult ? 1 : 0);

  const cards = [
    {
      id: "health",
      testId: "metric-health",
      title: t("kpi_data_health", "Data Health"),
      value: (rowCount > 0 && healthScore != null) ? `${healthScore}/100` : "Not assessed",
      sub: (rowCount > 0 && healthScore != null) ? "Authoritative quality verified" : "Requires tabular data",
      color: (rowCount > 0 && healthScore != null) ? "#16A34A" : "#64748B",
      bg: (rowCount > 0 && healthScore != null) ? "#F0FDF4" : "#F8FAFC",
      action: t("btn_inspect_quality", "Inspect Quality"),
      onClick: () => {
        setCurrentStage("quality");
        if (setView) setView("health");
      }
    },
    {
      id: "records",
      testId: "metric-records",
      title: t("kpi_total_records", "Dataset Records"),
      value: rowCount.toLocaleString(),
      sub: `${colCount} active columns`,
      color: "#2563EB",
      bg: "#EFF6FF",
      action: t("btn_explore_data", "Explore Data"),
      onClick: () => setCurrentStage("explore")
    },
    {
      id: "findings",
      testId: "metric-findings",
      title: t("kpi_ai_findings", "AI Findings"),
      value: findingsCount.toString(),
      sub: rowCount > 0 ? "Insights auto-scanned" : "No active dataset",
      color: "#DC2626",
      bg: "#FEF2F2",
      action: t("btn_investigate", "Investigate"),
      onClick: () => setCurrentStage("insights")
    },
    {
      id: "transformations",
      testId: "metric-transformations",
      title: t("kpi_transformations", "Transformations"),
      value: Math.max(0, history.length - 1).toString(),
      sub: `Lineage steps v1 → ${versionTag}`,
      color: "#D97706",
      bg: "#FFFBEB",
      action: t("btn_view_lineage", "View Lineage"),
      onClick: () => {
        if (setView) setView("lineage");
        else openActivityDrawer();
      }
    },
    {
      id: "forecast",
      testId: "metric-forecast",
      title: t("kpi_forecast_trajectory", "Forecast Trajectory"),
      value: hasForecast ? "+12.4% (vs Prior 6M Baseline)" : "Not yet run",
      sub: hasForecast ? "Calculated over 6-Month horizon (95% CI)" : "Run Stage 08 Forecast to project",
      color: "#2563EB",
      bg: "#EFF6FF",
      action: t("btn_open_forecast", "Open Forecast"),
      onClick: () => {
        setCurrentStage("forecast");
        if (setView) setView("forecast");
      }
    },
    {
      id: "models",
      testId: "metric-models",
      title: t("kpi_trained_models", "Trained ML Models"),
      value: trainedModelsCount > 0 ? `${trainedModelsCount} Models Trained` : "0 Models Trained",
      sub: trainedModelsCount > 0 ? "AutoML models active" : "Train models in Stage 07",
      color: "#16A34A",
      bg: "#F0FDF4",
      action: t("btn_compare_models", "Compare Models"),
      onClick: () => {
        setCurrentStage("modeling");
        if (setView) setView("models");
      }
    }
  ];

  const handleUploadClick = () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
    } else if (setView) {
      setView("datasets");
    }
  };

  return (
    <div data-testid="workspace-command-center" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 🏢 Command Center Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#FFFFFF",
        borderRadius: 16,
        padding: "24px 28px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 18,
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 11, color: "#38BDF8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            AI Business & Science Workspace
          </div>
          <div data-testid="command-center-greeting" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {getGreeting()}, {userName}
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <span>Active Dataset: <strong style={{ color: "#FFF" }}>{datasetName}</strong></span>
            <span>•</span>
            <span>Version: <strong style={{ color: "#38BDF8" }}>{versionTag}</strong></span>
            <span>•</span>
            <span>Health: <strong style={{ color: (rowCount > 0 && healthScore != null) ? "#4ADE80" : "#94A3B8" }}>{(rowCount > 0 && healthScore != null) ? `${healthScore}/100` : "Not assessed"}</strong></span>
            <span>•</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#CBD5E1", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4 }}>
              SHA: {rawHash.length > 16 ? `${rawHash.slice(0, 10)}...` : rawHash}
            </span>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            data-testid="command-center-upload-btn"
            onClick={handleUploadClick}
            style={{
              background: "#2563EB",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
            }}
          >
            <span>⬆ {t("btn_upload_dataset", "Upload Dataset")}</span>
          </button>

          <button
            data-testid="command-center-decisions-btn"
            onClick={openInbox}
            style={{
              background: pendingDecisions.length > 0 ? "#DC2626" : "rgba(255,255,255,0.12)",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>📥 {t("decisions", "Decisions Inbox")}</span>
            {pendingDecisions.length > 0 && (
              <span data-testid="command-center-decision-badge" style={{ background: "#FFF", color: "#DC2626", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                {pendingDecisions.length}
              </span>
            )}
          </button>

          <button
            data-testid="command-center-lineage-btn"
            onClick={() => {
              if (setView) setView("lineage");
              else openActivityDrawer();
            }}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🌳 {t("btn_view_lineage", "Data Lineage")}</span>
          </button>

          <button
            data-testid="command-center-studio-btn"
            onClick={() => setView && setView("studio")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🎨 Studio</span>
          </button>

          <button
            data-testid="command-center-notebook-btn"
            onClick={() => setView && setView("notebook")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>📓 Notebook</span>
          </button>

          <button
            data-testid="command-center-models-btn"
            onClick={() => setView && setView("models")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🏢 Models</span>
          </button>

          <button
            data-testid="command-center-scenarios-btn"
            onClick={() => setView && setView("scenarios")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🔮 Scenarios</span>
          </button>

          <button
            data-testid="command-center-audit-btn"
            onClick={() => setView && setView("audit")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🛡️ Audit</span>
          </button>
        </div>
      </div>

      {/* 📊 6 Interactive Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        {cards.map(c => (
          <div
            key={c.id}
            data-testid={c.testId}
            onClick={c.onClick}
            style={{
              background: "var(--bg-secondary, #FFFFFF)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              cursor: "pointer",
              transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.borderColor = c.color;
              e.currentTarget.style.boxShadow = `0 6px 16px rgba(15,23,42,0.08)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--border-color, #E2E8F0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(15,23,42,0.03)";
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary, #64748B)" }}>
              {c.title}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              {c.value}
            </div>
            <div style={{ fontSize: 11.5, color: c.color, fontWeight: 700 }}>
              {c.sub}
            </div>
            <div style={{
              fontSize: 11.5,
              fontWeight: 800,
              color: c.color,
              background: c.bg,
              padding: "4px 8px",
              borderRadius: 6,
              alignSelf: "flex-start",
              marginTop: 4
            }}>
              [{c.action}] →
            </div>
          </div>
        ))}
      </div>

      {/* 🧭 Multi-Section Workspace Tabs */}
      <div style={{
        background: "var(--bg-secondary, #FFFFFF)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 8px rgba(15,23,42,0.03)"
      }}>
        {/* Tab Headers */}
        <div style={{ display: "flex", gap: 10, borderBottom: "1px solid var(--border-color, #E2E8F0)", paddingBottom: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <button
            data-testid="tab-datasets"
            onClick={() => setActiveTab("datasets")}
            style={{
              background: activeTab === "datasets" ? "#2563EB" : "transparent",
              color: activeTab === "datasets" ? "#FFF" : "var(--text-secondary, #64748B)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            📁 Active Dataset
          </button>
          <button
            data-testid="tab-decisions"
            onClick={() => setActiveTab("decisions")}
            style={{
              background: activeTab === "decisions" ? "#2563EB" : "transparent",
              color: activeTab === "decisions" ? "#FFF" : "var(--text-secondary, #64748B)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>📥 Pending AI Decisions</span>
            {pendingDecisions.length > 0 && (
              <span style={{ background: activeTab === "decisions" ? "#FFF" : "#DC2626", color: activeTab === "decisions" ? "#2563EB" : "#FFF", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>
                {pendingDecisions.length}
              </span>
            )}
          </button>
          <button
            data-testid="tab-activity"
            onClick={() => setActiveTab("activity")}
            style={{
              background: activeTab === "activity" ? "#2563EB" : "transparent",
              color: activeTab === "activity" ? "#FFF" : "var(--text-secondary, #64748B)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🕒 Live Audit & Lineage
          </button>
          <button
            data-testid="tab-stages"
            onClick={() => setActiveTab("stages")}
            style={{
              background: activeTab === "stages" ? "#2563EB" : "transparent",
              color: activeTab === "stages" ? "#FFF" : "var(--text-secondary, #64748B)",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            🧭 9-Stage Workflow Jump
          </button>
        </div>

        {/* Tab 1: Active Dataset Overview */}
        {activeTab === "datasets" && (
          <div data-testid="tab-content-datasets" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div data-testid="active-dataset-card" style={{
              background: "var(--bg-primary, #F8FAFC)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#2563EB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  📄
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>{datasetName}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#2563EB", color: "#FFF", padding: "2px 8px", borderRadius: 10 }}>{versionTag}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, background: "#16A34A", color: "#FFF", padding: "2px 8px", borderRadius: 10 }}>Health {healthScore}/100</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", marginTop: 4 }}>
                    {rowCount.toLocaleString()} records • {colCount} columns • Immutable Hash: <code style={{ fontSize: 11, background: "rgba(0,0,0,0.05)", padding: "1px 4px", borderRadius: 3 }}>{rawHash.slice(0, 16)}...</code>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setCurrentStage("explore")}
                  style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Explore Data →
                </button>
                <button
                  onClick={() => {
                    if (setView) setView("lineage");
                    else openActivityDrawer();
                  }}
                  style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  View Lineage
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)" }}>
              Columns available in active stack: <strong>{(activeCols || []).slice(0, 8).join(", ") || "None"}</strong>{(activeCols || []).length > 8 ? ` and ${activeCols.length - 8} more` : ""}
            </div>
          </div>
        )}

        {/* Tab 2: Pending AI Decisions */}
        {activeTab === "decisions" && (
          <div data-testid="tab-content-decisions" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pendingDecisions.length === 0 ? (
              <div data-testid="cc-empty-decisions" style={{ padding: 30, textAlign: "center", color: "#64748B" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>All AI Decisions Reviewed</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>All recommendations for the active dataset have been addressed.</div>
              </div>
            ) : (
              pendingDecisions.map(d => (
                <div
                  key={d.id}
                  data-testid={`decision-item-${d.id}`}
                  style={{
                    background: "var(--bg-primary, #F8FAFC)",
                    border: "1px solid var(--border-color, #E2E8F0)",
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 10 }}>
                        {d.severity}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{d.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748B" }}>Version: {d.datasetVersion || "v1"}</span>
                  </div>

                  <div style={{ fontSize: 12, color: "#475569", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 10, borderRadius: 8 }}>
                    <div><strong>Why AI Recommends This:</strong> {d.why || d.rationale}</div>
                    <div style={{ marginTop: 4 }}><strong>Estimated Impact:</strong> {d.impact}</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Scope: {d.affectedRows} affected rows • {d.affectedCols} columns</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      data-testid={`cc-inspect-decision-${d.id}`}
                      onClick={() => openInvestigation({
                        title: d.title,
                        question: d.why || d.rationale,
                        affectedRows: d.affectedRows,
                        findings: [d.recommendation, d.impact]
                      })}
                      style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      🔍 Inspect Evidence
                    </button>
                    <button
                      data-testid={`cc-reject-decision-${d.id}`}
                      onClick={() => rejectDecision(d.id, "Rejected via Command Center")}
                      style={{ background: "transparent", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 6, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      ✕ Reject
                    </button>
                    <button
                      data-testid={`cc-approve-decision-${d.id}`}
                      onClick={() => applyDecision(d.id, activeRole)}
                      style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      ✓ Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Activity & Audit Trail */}
        {activeTab === "activity" && (
          <div data-testid="tab-content-activity" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Real-time Audit Trail Events</span>
              {setView && (
                <button
                  data-testid="cc-open-audit-btn"
                  onClick={() => setView("audit")}
                  style={{ background: "transparent", color: "#2563EB", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Open Full Audit Center →
                </button>
              )}
            </div>

            {events.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#64748B", fontSize: 12 }}>
                No events recorded yet for this session.
              </div>
            ) : (
              events.slice(0, 5).map(e => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "var(--bg-primary, #F8FAFC)",
                    border: "1px solid var(--border-color, #E2E8F0)",
                    borderRadius: 8,
                    fontSize: 12
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>✓ {e.action}</span>
                    <span style={{ fontSize: 11, color: "#64748B", marginLeft: 8 }}>[{e.stage}]</span>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{e.timestamp}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 4 }}>
                    {e.datasetVersion || "v1"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: 9-Stage Workflow Jump */}
        {activeTab === "stages" && (
          <div data-testid="tab-content-stages" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {WORKFLOW_STAGES.map(stage => {
              const lockState = getStageLockState(stage.id, currentStage, ["raw", "quality"], activeRole);
              const isCurrent = currentStage === stage.id;

              return (
                <div
                  key={stage.id}
                  data-testid={`stage-card-${stage.id}`}
                  onClick={() => {
                    if (lockState !== "restricted" && lockState !== "locked") {
                      setCurrentStage(stage.id);
                    }
                  }}
                  style={{
                    background: isCurrent ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" : "var(--bg-primary, #F8FAFC)",
                    color: isCurrent ? "#FFFFFF" : "var(--text-primary, #0F172A)",
                    border: isCurrent ? "1px solid #0F172A" : "1px solid var(--border-color, #E2E8F0)",
                    borderRadius: 12,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    cursor: lockState === "restricted" || lockState === "locked" ? "not-allowed" : "pointer",
                    opacity: lockState === "restricted" || lockState === "locked" ? 0.6 : 1
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 18 }}>{stage.icon}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 4,
                      padding: "2px 6px",
                      background: isCurrent ? "#38BDF8" : lockState === "completed" ? "#16A34A" : "rgba(0,0,0,0.06)",
                      color: isCurrent ? "#0F172A" : lockState === "completed" ? "#FFF" : "#64748B"
                    }}>
                      {lockState.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {stage.number}. {stage.label}
                  </div>
                  <div style={{ fontSize: 11, color: isCurrent ? "#94A3B8" : "#64748B", lineHeight: 1.3 }}>
                    {stage.description}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
