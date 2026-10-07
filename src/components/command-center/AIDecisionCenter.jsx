// src/components/command-center/AIDecisionCenter.jsx
import React from "react";
import { useDataset } from "../../context/DatasetContext";
import { useDecision } from "../../context/DecisionContext";
import { useActivity } from "../../context/ActivityContext";
import { useRole } from "../../context/RoleContext";
import { calculateDataQuality } from "../../utils/dataQuality";

export default function AIDecisionCenter({ setView }) {
  const { currentVersion, rawVersion, activeDataset, activeRows, activeCols, openInvestigation } = useDataset();
  const { pendingDecisions, openInbox, applyDecision, rejectDecision } = useDecision();
  const { events } = useActivity();
  const { activeRole } = useRole() || {};

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Workspace Dataset";
  const versionTag = currentVersion?.version || activeDataset?.currentVersion || "v1 Raw";
  const rowCount = activeRows ? activeRows.length : (activeDataset?.rowCount || 0);
  const colCount = activeCols ? activeCols.length : (activeDataset?.columnCount || 0);
  const rawHash = activeDataset?.rawHash || (rawVersion ? rawVersion.hash : "sha256-root-hash");
  const calculatedQuality = (activeRows && activeCols && activeRows.length > 0) ? calculateDataQuality(activeRows, activeCols).score : null;
  const qualityScore = activeDataset?.quality?.score != null ? activeDataset.quality.score : calculatedQuality;

  const topDecision = pendingDecisions.length > 0 ? pendingDecisions[0] : null;

  return (
    <div data-testid="ai-decision-center" style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 2px 8px rgba(15,23,42,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🧠 4-AREA AI COMMAND CENTER & DECISION HUB</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)" }}>
            Complete visibility into AI understanding, recommendations, changes, and required decisions.
          </div>
        </div>
        <span data-testid="dc-dataset-pill" style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "4px 10px", borderRadius: 12 }}>
          Dataset: {datasetName} ({versionTag})
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* AREA A: WHAT AI UNDERSTANDS */}
        <div data-testid="dc-area-understands" style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>A. What AI Understands</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--text-secondary, #334155)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
              <span><strong>{colCount} columns</strong> identified & classified</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
              <span><strong>{rowCount.toLocaleString()} records</strong> analyzed in active stack</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
              <span><strong>Data Quality Score: {qualityScore != null ? `${qualityScore}/100 (Calculated)` : "Not assessed"}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#16A34A", fontWeight: 800 }}>✓</span>
              <span><strong>Immutable Raw Version ({rawHash.slice(0, 10)}...)</strong> verified</span>
            </div>
          </div>
        </div>

        {/* AREA B: WHAT AI RECOMMENDS */}
        <div data-testid="dc-area-recommends" style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>B. What AI Recommends</div>
            {topDecision && (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 10 }}>
                {topDecision.severity}
              </span>
            )}
          </div>

          {topDecision ? (
            <>
              <div data-testid="dc-top-decision-title" style={{ fontSize: 12.5, fontWeight: 800, color: "#78350F" }}>
                {topDecision.title}
              </div>
              <div style={{ fontSize: 11.5, color: "#92400E", lineHeight: 1.4 }}>
                <strong>Why?</strong> {topDecision.why || topDecision.rationale}<br />
                <strong>Impact:</strong> {topDecision.impact}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <button
                  data-testid="dc-investigate-btn"
                  onClick={() => openInvestigation({
                    title: topDecision.title,
                    question: topDecision.why || topDecision.rationale,
                    affectedRows: topDecision.affectedRows,
                    findings: [topDecision.recommendation, topDecision.impact]
                  })}
                  style={{ background: "#78350F", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Investigate →
                </button>
                <button
                  data-testid="dc-reject-btn"
                  onClick={() => rejectDecision(topDecision.id, "Rejected via AI Decision Hub")}
                  style={{ background: "transparent", color: "#991B1B", border: "1px solid #F87171", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  ✕ Reject
                </button>
                <button
                  data-testid="dc-approve-btn"
                  onClick={() => applyDecision(topDecision.id, activeRole)}
                  style={{ background: "#16A34A", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  ✓ Approve Recommendation
                </button>
              </div>
            </>
          ) : (
            <div data-testid="dc-no-recommendations" style={{ fontSize: 12, color: "#92400E", padding: "10px 0" }}>
              ✓ All AI recommendations evaluated and applied or rejected.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* AREA C: WHAT AI CHANGED */}
        <div data-testid="dc-area-changed" style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>C. What AI Changed Today</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
            {events.length === 0 ? (
              <div style={{ color: "#64748B", fontSize: 11.5 }}>No operations applied yet in this session.</div>
            ) : (
              (events.slice(0, 3)).map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #F1F5F9)", paddingBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>✓ {e.action}</span>
                    <div style={{ fontSize: 11, color: "var(--text-secondary, #64748B)" }}>{e.timestamp}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "2px 6px", borderRadius: 4 }}>
                    {e.datasetVersion || "v1"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AREA D: WHAT NEEDS YOUR DECISION */}
        <div data-testid="dc-area-waiting" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B" }}>D. Decisions Waiting</div>
            <span data-testid="dc-pending-badge" style={{ fontSize: 11, fontWeight: 800, color: "#FFF", background: "#DC2626", padding: "2px 8px", borderRadius: 10 }}>
              {pendingDecisions.length} Pending
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#B91C1C" }}>
            {pendingDecisions.length} operational recommendation{pendingDecisions.length === 1 ? "" : "s"} require your explicit user review and confirmation.
          </div>
          <button
            data-testid="dc-open-inbox-btn"
            onClick={openInbox}
            style={{ background: "#991B1B", color: "#FFF", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", marginTop: 4 }}
          >
            Review Decisions Inbox ({pendingDecisions.length}) →
          </button>
        </div>
      </div>
    </div>
  );
}
