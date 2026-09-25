// src/components/workspace/DatasetHeader.jsx
import React, { useState } from "react";
import ChangeHistoryDrawer from "./ChangeHistoryDrawer";
import { useDataset } from "../../context/DatasetContext";

export default function DatasetHeader() {
  const { currentVersion, activeDataset, activeRows, activeCols, history } = useDataset();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const datasetName = currentVersion?.datasetName || activeDataset?.name || "Audit Operations Sample";
  const versionTag = currentVersion?.version || "v1";
  const rowCount = activeRows.length;
  const colCount = activeCols.length;
  const changeCount = Math.max(0, history.length - 1);

  return (
    <div style={{
      background: "var(--bg-secondary, #FFFFFF)",
      border: "1px solid var(--border-color, #E2E8F0)",
      borderRadius: 14,
      padding: "16px 20px",
      marginBottom: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      display: "flex",
      justify: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12
    }}>
      {/* Dataset Name & Version Details */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justify: "center",
          fontSize: 20,
          fontWeight: 800,
          boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
        }}>
          📂
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
              {datasetName}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, background: "#2563EB", color: "#FFF", padding: "2px 8px", borderRadius: 12 }}>
              {versionTag}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
            <span>{rowCount.toLocaleString()} Rows</span>
            <span>•</span>
            <span>{colCount} Columns</span>
            <span>•</span>
            <span style={{ color: "#10B981", fontWeight: 700 }}>✓ Data Quality 94%</span>
          </div>
        </div>
      </div>

      {/* Change History Trigger */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          style={{
            background: "var(--bg-primary, #F8FAFC)",
            border: "1px solid var(--border-color, #CBD5E1)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary, #0F172A)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#2563EB"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-color, #CBD5E1)"}
        >
          <span>📜 Change History</span>
          <span style={{ background: "#2563EB", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {changeCount}
          </span>
        </button>

        <ChangeHistoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
