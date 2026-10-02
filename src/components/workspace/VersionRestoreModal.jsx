// src/components/workspace/VersionRestoreModal.jsx
import React from "react";
import { useDataset } from "../../context/DatasetContext";
import { useActivity } from "../../context/ActivityContext";

export default function VersionRestoreModal({ isOpen, targetVersion, onClose }) {
  const { currentVersion, restoreVersionStack, applyTransformation } = useDataset();
  const { logEvent } = useActivity();

  if (!isOpen || !targetVersion) return null;

  const handleConfirmRestore = () => {
    logEvent({
      stage: "04 Cleaned Data",
      action: `Restored version ${targetVersion.version}`,
      datasetVersion: `v5 (Restored from ${targetVersion.version})`,
      affectedRows: targetVersion.rowCount || 12482,
      affectedColumns: targetVersion.colCount || 18,
      result: `Created non-destructive version v5 restored from ${targetVersion.version}. Prior versions remain untouched.`
    });

    if (restoreVersionStack) {
      restoreVersionStack(targetVersion.version);
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justify: "center",
      padding: 20
    }}>
      <div style={{
        width: 500,
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
          justify: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ↩ Lineage Restore Confirmation
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Restore Version {targetVersion.version}?
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

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1E4ED8" }}>
              Current Version: {currentVersion?.version || "v4"} ➔ Target Version: {targetVersion.version}
            </div>
            <div style={{ fontSize: 12, color: "#1E3A8A", marginTop: 4, lineHeight: 1.5 }}>
              Restoring version {targetVersion.version} will create <strong>v5 — Restored from {targetVersion.version}</strong>.
            </div>
          </div>

          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 12, fontSize: 12.5, color: "#166534" }}>
            🔒 <strong>Non-Destructive Guarantee:</strong> Existing versions (v1, v2, v3, v4) will NOT be deleted or mutated. Full audit lineage is preserved.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 700,
                color: "#475569",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
              }}
            >
              ✓ Create v5 (Restored from {targetVersion.version})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
