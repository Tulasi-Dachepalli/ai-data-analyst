// src/components/workspace/AIActionConfirmationModal.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useActivity } from "../../context/ActivityContext";

export default function AIActionConfirmationModal({ actionData, onApply, onIgnore }) {
  const { openInvestigation } = useDataset();
  const { logEvent } = useActivity();
  const [applied, setApplied] = useState(false);

  if (!actionData) return null;

  const handleApply = () => {
    setApplied(true);
    logEvent({
      stage: actionData.stage || "03 Data Cleaning",
      action: actionData.title || "Applied AI Recommendation",
      datasetVersion: "v4 Cleaned",
      affectedRows: actionData.affectedRows || 24,
      affectedColumns: 3,
      result: `Successfully applied: ${actionData.actionTitle || "Duplicate Removal"}`
    });
    if (onApply) onApply(actionData);
  };

  return (
    <div style={{
      background: applied ? "#F0FDF4" : "#FFFFFF",
      border: `1px solid ${applied ? "#BBF7D0" : "#E2E8F0"}`,
      borderRadius: 14,
      padding: 18,
      boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginBottom: 16
    }}>
      {!applied ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase" }}>
                  AI Recommendation & Confirmation
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
                  {actionData.title || "24 Duplicate Records Detected"}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D97706", background: "#FFFBEB", padding: "3px 10px", borderRadius: 12 }}>
              Requires Confirmation
            </span>
          </div>

          <div style={{ fontSize: 12.5, color: "#475569", background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
            <strong>Recommended Action:</strong> {actionData.actionTitle || "Remove duplicates"} across {actionData.affectedRows || 24} detected rows to preserve data integrity.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => openInvestigation({
                title: actionData.title,
                question: "Why does the AI recommend removing these 24 rows?",
                affectedRows: actionData.affectedRows || 24,
                findings: ["Duplicate transaction IDs detected.", "Pre-transformation cell diff preview ready."]
              })}
              style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🔍 Preview Changes
            </button>
            <button
              onClick={onIgnore}
              style={{ background: "transparent", color: "#64748B", border: "none", padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              Ignore
            </button>
            <button
              onClick={handleApply}
              style={{ background: "#2563EB", color: "#FFFFFF", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(37,99,235,0.2)" }}
            >
              ✓ Apply Change (v3 → v4)
            </button>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, color: "#16A34A" }}>✓</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#166534" }}>
                Change Applied Successfully (Created Version v4 Cleaned)
              </div>
              <div style={{ fontSize: 12, color: "#15803D" }}>
                {actionData.affectedRows || 24} records processed • Incremental lineage snapshot logged
              </div>
            </div>
          </div>
          <button
            onClick={() => openInvestigation({
              title: "Lineage Step v3 → v4",
              question: "Inspect applied duplicate removal changes",
              affectedRows: actionData.affectedRows || 24,
              findings: ["24 duplicate rows removed.", "Version v4 Cleaned validated."]
            })}
            style={{ background: "#166534", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
          >
            Inspect Change →
          </button>
        </div>
      )}
    </div>
  );
}
