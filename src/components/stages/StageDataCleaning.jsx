// src/components/stages/StageDataCleaning.jsx
import React, { useState } from "react";
import DataAutoCleaner from "../../DataAutoCleaner";
import AIActionConfirmationModal from "../workspace/AIActionConfirmationModal";
import { useDataset } from "../../context/DatasetContext";

export default function StageDataCleaning() {
  const { activeRows, activeCols, applyTransformation, setCurrentStage } = useDataset();
  const [recommendation, setRecommendation] = useState(() => {
    if (!activeRows || activeRows.length === 0) return null;
    const uniqueMap = new Map();
    let dupsCount = 0;
    activeRows.forEach(row => {
      const key = JSON.stringify(row);
      if (uniqueMap.has(key)) dupsCount++;
      else uniqueMap.set(key, true);
    });
    if (dupsCount > 0) {
      return {
        stage: "03 Data Cleaning",
        title: `AI Recommendation: ${dupsCount} Duplicate Record(s) Detected`,
        actionTitle: "Remove duplicate records",
        affectedRows: dupsCount
      };
    }
    return null;
  });

  const handleApplyDedupe = () => {
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
      operationType: "dedupe",
      columns: activeCols,
      reason: "Duplicate records detected across rows",
      method: "Removed exact duplicate rows",
      newRows: cleanRows,
      newCols: activeCols,
      affectedRowsCount: Math.max(1, dupsCount),
      beforeSample: { rows: activeRows.slice(0, 3) },
      afterSample: { rows: cleanRows.slice(0, 3) }
    });
    setRecommendation(null);
  };

  if (!activeRows || activeRows.length === 0) {
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
        <div style={{ fontSize: 44, marginBottom: 12 }}>🧹</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)", margin: "0 0 8px 0" }}>
          No Tabular Data Available for Stage 03 Cleaning
        </h3>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary, #64748B)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
          Upload a CSV or Excel dataset to perform verified transactional deduplication and imputation.
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>Stage 03 — Transactional Data Cleaning</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Execute transactional data cleaning steps. Every change creates a new traceable version.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("cleaned")}
          style={{ background: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          View Cleaned Dataset →
        </button>
      </div>

      {/* AI Recommendation & Action Confirmation Card */}
      {recommendation && (
        <AIActionConfirmationModal
          actionData={recommendation}
          onApply={handleApplyDedupe}
          onIgnore={() => setRecommendation(null)}
        />
      )}

      {/* Transactional Quick Cleaning Actions */}
      <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 12 }}>Recommended Cleaning Operations</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, background: "var(--bg-primary, #F8FAFC)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>1. Duplicate Removal</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 10 }}>Identifies and removes identical rows.</div>
            <button
              onClick={handleApplyDedupe}
              style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Apply & Create Version →
            </button>
          </div>
        </div>
      </div>

      <DataAutoCleaner data={activeRows} columns={activeCols} />
    </div>
  );
}
