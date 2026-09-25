// src/components/stages/StageDataCleaning.jsx
import React, { useState } from "react";
import DataAutoCleaner from "../../DataAutoCleaner";
import BeforeAfterTable from "../common/BeforeAfterTable";
import { useDataset } from "../../context/DatasetContext";

export default function StageDataCleaning() {
  const { activeRows, activeCols, applyTransformation, setCurrentStage } = useDataset();
  const [selectedOp, setSelectedOp] = useState(null);

  const handleApplyDedupe = () => {
    // Transactional Deduplicate Operation
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
  };

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
