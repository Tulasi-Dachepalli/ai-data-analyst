// src/components/stages/StageInsights.jsx
import React from "react";
import AiExecutiveNarrativeCard from "../../AiExecutiveNarrativeCard";
import AnomalyInvestigator from "../../AnomalyInvestigator";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function StageInsights() {
  const { activeDataset, activeRows, activeCols, currentVersion, setCurrentStage, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();

  const datasetName = activeDataset?.name || "No Dataset Loaded";
  const versionTag = currentVersion?.version || activeDataset?.currentVersion || "v1";
  const recordCount = activeRows.length;

  const handleAskCopilot = (topic) => {
    if (askQuestion) {
      askQuestion(`Investigate finding: ${topic} in dataset ${datasetName} (${versionTag})`);
    }
  };

  if (recordCount === 0) {
    return (
      <div style={{
        background: "var(--bg-secondary, #FFFFFF)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 16,
        padding: "48px 32px",
        textAlign: "center",
        maxWidth: 640,
        margin: "32px auto",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
          No Tabular Data Available for Stage 06 Insights
        </h3>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary, #64748B)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
          Upload a CSV or Excel dataset, or select a table from an HTML document to generate grounded insights and anomaly detections.
        </p>
        <button
          onClick={() => {
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.click();
          }}
          style={{
            background: "#2563EB",
            color: "#FFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
          }}
        >
          ⬆ Upload Dataset
        </button>
      </div>
    );
  }

  // Dynamically generate insight cards based on actual dataset columns and records
  const insightCards = [];

  // Check numeric columns
  const numericCols = (activeCols || []).filter(c => {
    return activeRows.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "" && r[c] !== null));
  });

  if (numericCols.length > 0) {
    const primaryNum = numericCols[0];
    const vals = activeRows.map(r => Number(r[primaryNum])).filter(v => !isNaN(v));
    const mean = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    insightCards.push({
      id: "metric-dist",
      priority: "🟢 POSITIVE",
      priorityBg: "#F0FDF4",
      priorityColor: "#16A34A",
      title: `${primaryNum} distribution verified across ${recordCount.toLocaleString()} records.`,
      finding: `Mean computed value is ${mean.toLocaleString()} across ${recordCount.toLocaleString()} active dataset records.`,
      evidenceRecords: recordCount,
      affectedRows: recordCount,
      columns: [primaryNum],
      groundingScore: "Dataset connected",
      explanation: `Deterministic statistical distribution calculated across all non-null entries in ${primaryNum}.`,
      recommendation: `Include metric aggregates in Stage 08 Time-Series Forecasting.`,
      transformation: { operation: "Distribution Baseline", versionStep: `${versionTag} Verified` }
    });
  }

  // Check missing values / data health
  let missingTotal = 0;
  activeRows.forEach(r => {
    (activeCols || []).forEach(c => {
      if (r[c] === null || r[c] === undefined || String(r[c]).trim() === "") missingTotal++;
    });
  });

  if (missingTotal > 0) {
    insightCards.push({
      id: "quality-gap",
      priority: "🟡 WATCH",
      priorityBg: "#FFFBEB",
      priorityColor: "#D97706",
      title: `Completeness scan detected ${missingTotal} blank or null cell(s).`,
      finding: `Data completeness gaps observed across ${activeDataset?.name || "the active dataset"}.`,
      evidenceRecords: recordCount,
      affectedRows: missingTotal,
      columns: activeCols.slice(0, 3),
      groundingScore: "Dataset connected",
      explanation: "Missing values can introduce skew in downstream predictive modeling.",
      recommendation: "Apply imputation in Stage 03 Data Cleaning to establish baseline completeness.",
      transformation: { operation: "Imputation Scan", versionStep: `${versionTag} Audit` }
    });
  }

  // Categorical spread
  const catCols = (activeCols || []).filter(c => !numericCols.includes(c));
  if (catCols.length > 0) {
    const primaryCat = catCols[0];
    const uniqueVals = new Set(activeRows.map(r => String(r[primaryCat] || "")).filter(Boolean)).size;
    insightCards.push({
      id: "dimension-spread",
      priority: "🔴 ATTENTION",
      priorityBg: "#FEF2F2",
      priorityColor: "#DC2626",
      title: `${primaryCat} dimension contains ${uniqueVals} distinct categories.`,
      finding: `Categorical segmentation identified across ${uniqueVals} unique groups in ${primaryCat}.`,
      evidenceRecords: recordCount,
      affectedRows: recordCount,
      columns: [primaryCat],
      groundingScore: "Dataset connected",
      explanation: `High variance across category segments may warrant stratified modeling.`,
      recommendation: `Review category segmentation in Stage 05 Explore Studio.`,
      transformation: { operation: "Categorical Stratification", versionStep: `${versionTag} Evaluated` }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Stage 06 — AI Executive Findings & Evidence Insights
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Grounded findings, priority risk alerts, record evidence, and action recommendations.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("modeling")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}
        >
          Build Predictive Model →
        </button>
      </div>

      {/* AI Analysis Priority Cards Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          🤖 AI Analysis Summary ({insightCards.length} Grounded Findings)
        </div>

        {insightCards.map(card => (
          <div key={card.id} style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: 20,
            boxShadow: "0 2px 8px rgba(15,23,42,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 12
          }}>
            {/* Priority Tag & Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  background: card.priorityBg,
                  color: card.priorityColor,
                  fontWeight: 800,
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${card.priorityColor}33`
                }}>
                  {card.priority}
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{card.title}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "4px 10px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                ✓ {card.groundingScore}
              </span>
            </div>

            {/* Evidence & Scope Pills */}
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#64748B", background: "#F8FAFC", padding: "8px 12px", borderRadius: 8 }}>
              <div><strong>Evidence Base:</strong> {card.evidenceRecords.toLocaleString()} records evaluated</div>
              <div><strong>Affected Rows:</strong> {card.affectedRows} rows</div>
              <div><strong>Relevant Columns:</strong> {card.columns.join(", ")}</div>
            </div>

            {/* Explanation & Action Recommendation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12.5, lineHeight: 1.5 }}>
              <div style={{ background: "#FAFAFA", padding: 10, borderRadius: 8, borderLeft: "3px solid #64748B" }}>
                <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: 2 }}>💡 Root Cause Explanation</div>
                <div style={{ color: "#475569" }}>{card.explanation}</div>
              </div>
              <div style={{ background: "#EFF6FF", padding: 10, borderRadius: 8, borderLeft: "3px solid #2563EB" }}>
                <div style={{ fontWeight: 700, color: "#1E4ED8", marginBottom: 2 }}>🎯 Recommended Next Action</div>
                <div style={{ color: "#1E3A8A" }}>{card.recommendation}</div>
              </div>
            </div>

            {/* Interactive Action Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={() => openInvestigation({
                  title: card.title,
                  question: `Why did ${card.title.toLowerCase()}?`,
                  affectedRows: card.affectedRows,
                  findings: [card.finding, card.explanation, card.recommendation],
                  transformation: card.transformation,
                  auditDiff: card.auditDiff
                })}
                style={{
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🔬 View Evidence
              </button>
              <button
                onClick={() => handleAskCopilot(card.title)}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                🤖 Ask Copilot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Component Visualizations */}
      <AiExecutiveNarrativeCard data={activeRows} columns={activeCols} dataset={activeDataset} />
      <AnomalyInvestigator data={activeRows} columns={activeCols} />
    </div>
  );
}
