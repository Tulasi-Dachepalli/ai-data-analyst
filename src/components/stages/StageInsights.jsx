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

  const insightCards = [
    {
      id: "high-1",
      priority: "🔴 HIGH ATTENTION",
      priorityBg: "#FEF2F2",
      priorityColor: "#DC2626",
      title: "South region operating costs are above the established baseline variance.",
      finding: "Operating expenditure in the South region exceeded expected quarterly budget thresholds by +18.4%.",
      evidenceRecords: recordCount,
      affectedRows: 412,
      columns: ["Operating_Cost", "Region", "Quarter"],
      groundingScore: "98% Grounded",
      explanation: "Variance is driven by vendor software license sync delays and unbudgeted regional compliance audits.",
      recommendation: "Re-negotiate vendor contract schedules or apply tier adjustment filters in Stage 07 modeling.",
      transformation: { operation: "Variance Filter", versionStep: "v3 → v4 Cleaned" },
      auditDiff: [
        { id: "AUD-8012", before: "Unflagged cost spike", after: "Flagged High-Risk (+18.4%)" },
        { id: "AUD-8013", before: "Unclassified Vendor B", after: "Re-allocated Software Licensing" }
      ]
    },
    {
      id: "watch-1",
      priority: "🟡 WATCH",
      priorityBg: "#FFFBEB",
      priorityColor: "#D97706",
      title: "Marketing license expenses increased across Q3 cycle.",
      finding: "SaaS licensing expenditure rose by +14.2% across marketing accounts.",
      evidenceRecords: recordCount,
      affectedRows: 128,
      columns: ["License_Fee", "Department"],
      groundingScore: "95% Grounded",
      explanation: "Duplicate license renewals detected prior to data cleaning transformation.",
      recommendation: "Confirm deduplication status in lineage timeline drawer.",
      transformation: { operation: "Duplicate License Removal", versionStep: "v2 → v3" },
      auditDiff: [
        { id: "LIC-401", before: "Duplicate renewal ($12,000)", after: "Removed ($0)" }
      ]
    },
    {
      id: "pos-1",
      priority: "🟢 POSITIVE",
      priorityBg: "#F0FDF4",
      priorityColor: "#16A34A",
      title: "Revenue increased consistently during the selected evaluation period.",
      finding: "Total enterprise revenue grew +8.2% month-over-month.",
      evidenceRecords: recordCount,
      affectedRows: 2450,
      columns: ["Revenue", "Date", "Transaction_ID"],
      groundingScore: "99% Grounded",
      explanation: "Growth driven by core enterprise account renewals and expanded tier adoption.",
      recommendation: "Include trend projections in Stage 08 Time-Series Forecast.",
      transformation: { operation: "Date Standardization", versionStep: "v1 → v4 Cleaned" }
    }
  ];

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
