// src/components/command-center/DecisionInbox.jsx
import React from "react";
import { useDecision } from "../../context/DecisionContext";
import { useDataset } from "../../context/DatasetContext";
import { useRole } from "../../context/RoleContext";

export default function DecisionInbox() {
  const { inboxOpen, closeInbox, pendingDecisions, applyDecision, rejectDecision } = useDecision();
  const { openInvestigation, activeDataset } = useDataset();
  const { activeRole } = useRole() || {};

  if (!inboxOpen) return null;

  return (
    <div
      data-testid="decision-inbox-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div style={{
        width: 600,
        maxWidth: "95vw",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 20px 40px rgba(15, 23, 42, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📥 Enterprise Decision Inbox
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              {pendingDecisions.length} Decisions Requiring Review
            </div>
            {activeDataset?.name && (
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                Target: {activeDataset.name} ({activeDataset.currentVersion || "v1"})
              </div>
            )}
          </div>
          <button
            data-testid="close-decision-inbox"
            onClick={closeInbox}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFF",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "75vh", overflowY: "auto" }}>
          {pendingDecisions.length === 0 ? (
            <div data-testid="empty-decision-inbox" style={{ padding: "40px 20px", textAlign: "center", color: "#64748B" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>All AI Decisions Reviewed</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>No pending recommendations require action at this time.</div>
            </div>
          ) : (
            pendingDecisions.map(d => (
              <div
                key={d.id}
                data-testid={`decision-card-${d.id}`}
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: 18,
                  background: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 10 }}>
                    {d.severity}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>
                    {d.datasetVersion ? `Version: ${d.datasetVersion}` : "Requires Confirmation"}
                  </span>
                </div>

                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                  {d.title}
                </div>

                <div style={{ fontSize: 12.5, color: "#475569", background: "#F8FAFC", padding: 10, borderRadius: 8, lineHeight: 1.4 }}>
                  <strong>Why?</strong> {d.why || d.rationale}<br />
                  <strong>Impact:</strong> {d.impact}
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    onClick={() => openInvestigation({
                      title: d.title,
                      question: d.why || d.rationale,
                      affectedRows: d.affectedRows,
                      findings: [d.recommendation, d.impact]
                    })}
                    style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    🔍 Inspect Evidence
                  </button>
                  <button
                    data-testid={`reject-decision-${d.id}`}
                    onClick={() => rejectDecision(d.id, "Rejected by user")}
                    style={{ background: "transparent", color: "#DC2626", border: "1px solid #FCA5A5", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    ✕ Reject
                  </button>
                  <button
                    data-testid={`apply-decision-${d.id}`}
                    onClick={() => applyDecision(d.id, activeRole)}
                    style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    ✓ Approve Recommendation
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
