// src/components/investigation/ProcessTimeline.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";

export default function ProcessTimeline({ isOpen, onClose }) {
  const { currentVersion, activeDataset, openInvestigation } = useDataset();
  const [expandedStep, setExpandedStep] = useState("v2");

  if (!isOpen) return null;

  const datasetName = activeDataset?.name || "No Dataset Loaded";

  const steps = [
    {
      version: "v1 Raw",
      title: "Original Immutable Raw Upload",
      status: "completed",
      detail: "File received & stored with SHA-256 canonical hash verification.",
      affectedRows: 12482,
      affectedCols: 18,
      reason: "Initial raw dataset baseline creation."
    },
    {
      version: "v2",
      title: "Duplicate Record Removal",
      status: "completed",
      detail: "Eliminated 24 duplicate row hashes detected across core ID fields.",
      affectedRows: 24,
      affectedCols: 3,
      reason: "Duplicate transaction IDs detected during automated quality scan.",
      before: "TX-1024 (Duplicate row)",
      after: "TX-1024 (Single unique record)"
    },
    {
      version: "v3",
      title: "Missing Value Imputation",
      status: "completed",
      detail: "Imputed missing operating cost metrics using median window estimation.",
      affectedRows: 18,
      affectedCols: 2,
      reason: "Missing null cost values detected in 18 rows.",
      before: "Cost: null",
      after: "Cost: $42,500 (Median imputed)"
    },
    {
      version: "v4 Cleaned",
      title: "Date Format Standardization",
      status: "completed",
      detail: "Standardized all date strings into ISO 8601 (YYYY-MM-DD) format.",
      affectedRows: 12458,
      affectedCols: 1,
      reason: "Unstandardized date strings found across regional accounts.",
      before: "15/03/2026",
      after: "2026-03-15"
    }
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(3px)",
      zIndex: 999,
      display: "flex",
      justifyContent: "flex-end"
    }}>
      <div style={{
        width: 500,
        maxWidth: "90vw",
        height: "100%",
        backgroundColor: "#FFFFFF",
        boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto"
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
              📜 Lineage Process Timeline
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Dataset Step History: {datasetName}
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Workflow Tree List */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {steps.map((st, idx) => {
            const isExpanded = expandedStep === st.version;
            return (
              <div key={st.version} style={{
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                overflow: "hidden",
                background: "#FFFFFF"
              }}>
                <div
                  onClick={() => setExpandedStep(isExpanded ? null : st.version)}
                  style={{
                    padding: 14,
                    background: isExpanded ? "#F8FAFC" : "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      background: "#2563EB",
                      color: "#FFFFFF",
                      padding: "3px 8px",
                      borderRadius: 6
                    }}>
                      {st.version}
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>
                      {st.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#64748B" }}>
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ padding: 16, borderTop: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                    <div style={{ color: "#475569" }}>{st.detail}</div>

                    <div style={{ background: "#F1F5F9", padding: 10, borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, color: "#0F172A" }}>Why was this step executed?</div>
                      <div style={{ color: "#334155", marginTop: 2 }}>{st.reason}</div>
                    </div>

                    {st.before && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "#FEF2F2", padding: 8, borderRadius: 6, color: "#991B1B" }}>
                          <strong>Before:</strong> {st.before}
                        </div>
                        <div style={{ background: "#F0FDF4", padding: 8, borderRadius: 6, color: "#166534" }}>
                          <strong>After:</strong> {st.after}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <span style={{ fontSize: 11.5, color: "#64748B" }}>{st.affectedRows} rows affected</span>
                      <button
                        onClick={() => openInvestigation({
                          title: `Lineage Step: ${st.title}`,
                          question: st.reason,
                          affectedRows: st.affectedRows,
                          findings: [st.detail, `Version: ${st.version}`]
                        })}
                        style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                      >
                        🔬 View Step Evidence →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
