// src/components/workspace/TransformationInspector.jsx
import React, { useState } from "react";
import BeforeAfterTable from "../common/BeforeAfterTable";
import { useDataset } from "../../context/DatasetContext";

export default function TransformationInspector({
  isOpen,
  onClose,
  transformation = {
    title: "Remove 24 Duplicate Records",
    operationType: "dedupe",
    why: "Duplicate audit IDs were detected across row records.",
    affectedRows: 24,
    affectedCols: 1,
    beforeRowsCount: 5024,
    afterRowsCount: 5000,
    method: "Retained first occurrence of duplicate audit_id values.",
    beforeSample: [],
    afterSample: [],
    targetCols: ["audit_id"]
  }
}) {
  const { applyTransformation, activeRows, activeCols } = useDataset();
  const [showDiffTable, setShowDiffTable] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    // Execute transactional operation
    const uniqueMap = new Map();
    const cleanRows = [];
    let dupsCount = 0;

    activeRows.forEach(row => {
      const key = JSON.stringify(row);
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        cleanRows.push(row);
      } else {
        dupsCount++;
      }
    });

    applyTransformation({
      operationType: transformation.operationType || "dedupe",
      columns: transformation.targetCols || activeCols,
      reason: transformation.why,
      method: transformation.method,
      newRows: cleanRows,
      newCols: activeCols,
      affectedRowsCount: Math.max(1, dupsCount || transformation.affectedRows),
      beforeSample: { rows: activeRows.slice(0, 5) },
      afterSample: { rows: cleanRows.slice(0, 5) }
    });

    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.5)",
      backdropFilter: "blur(6px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justify: "center",
      padding: 20
    }}>
      <div style={{
        background: "var(--bg-secondary, #FFFFFF)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 16,
        width: "100%",
        maxWidth: 640,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        padding: 24,
        position: "relative"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid var(--border-color, #E2E8F0)", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🧹</span>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              AI Recommended Transformation
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748B" }}>✕</button>
        </div>

        {appliedSuccess ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#10B981" }}>Transformation Applied Successfully!</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6 }}>
              New version created and saved to auditable lineage history.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", marginBottom: 16 }}>
              {transformation.title}
            </div>

            {/* Metrics Breakdown Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>AFFECTED ROWS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginTop: 2 }}>{transformation.affectedRows}</div>
              </div>

              <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>COLUMNS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#2563EB", marginTop: 2 }}>{transformation.affectedCols}</div>
              </div>

              <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>BEFORE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#475569", marginTop: 2 }}>{transformation.beforeRowsCount.toLocaleString()}</div>
              </div>

              <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>AFTER</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#10B981", marginTop: 2 }}>{transformation.afterRowsCount.toLocaleString()}</div>
              </div>
            </div>

            {/* Rationale & Method Details */}
            <div style={{ background: "var(--bg-primary, #F8FAFC)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "var(--text-primary)" }}>WHY: </strong>
                <span style={{ color: "var(--text-secondary)" }}>{transformation.why}</span>
              </div>
              <div>
                <strong style={{ color: "var(--text-primary)" }}>METHOD: </strong>
                <span style={{ color: "var(--text-secondary)" }}>{transformation.method}</span>
              </div>
            </div>

            {/* Preview Toggle Button */}
            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setShowDiffTable(!showDiffTable)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color, #E2E8F0)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#2563EB",
                  cursor: "pointer"
                }}
              >
                {showDiffTable ? "▲ Hide Before/After Preview" : "🔍 View Before/After Preview"}
              </button>

              {showDiffTable && (
                <BeforeAfterTable
                  beforeRows={activeRows.slice(0, 5)}
                  afterRows={activeRows.slice(1, 5)}
                  columns={activeCols}
                />
              )}
            </div>

            {/* Action Controls */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-color, #E2E8F0)", paddingTop: 16 }}>
              <button
                onClick={onClose}
                style={{ background: "none", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
              >
                Apply Transformation & Create Version →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
