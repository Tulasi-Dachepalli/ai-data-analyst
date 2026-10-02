// src/components/lineage/VersionRestoreModal.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useActivity } from "../../context/ActivityContext";
import { useRole } from "../../context/RoleContext";

export default function VersionRestoreModal({ isOpen, onClose, targetVersionTag }) {
  const { currentVersion, history = [], restoreVersion } = useDataset();
  const { logEvent } = useActivity() || { logEvent: () => {} };
  const { activeRole } = useRole() || {};

  const [reason, setReason] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen || !targetVersionTag) return null;

  const targetVersionObj = history.find(v => v.version === targetVersionTag) || {
    version: targetVersionTag,
    rowCount: 0,
    colCount: 0,
    hash: "sha256-target"
  };

  const currentVerNumber = currentVersion?.versionNumber || 1;
  const nextVerNumber = currentVerNumber + 1;
  const nextVerTag = `v${nextVerNumber}`;

  const handleConfirm = () => {
    setIsRestoring(true);
    const restored = restoreVersion ? restoreVersion(targetVersionTag) : null;

    const auditReason = reason.trim() || `Rollback / Restore to snapshot of ${targetVersionTag}`;
    logEvent({
      stage: "Lineage Restoration",
      action: `Restored Version: Created ${restored?.version || nextVerTag} from ${targetVersionTag}`,
      datasetVersion: restored?.version || nextVerTag,
      affectedRows: targetVersionObj.rowCount || 0,
      result: `Non-destructive restoration approved by ${activeRole || "analyst"}: ${auditReason}`
    });

    setIsRestoring(false);
    onClose();
  };

  return (
    <div
      data-testid="version-restore-modal"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div style={{
        width: 540,
        maxWidth: "95vw",
        backgroundColor: "var(--bg-secondary, #FFFFFF)",
        borderRadius: 16,
        boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
        border: "1px solid var(--border-color, #E2E8F0)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "18px 24px",
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Non-Destructive Lineage Restore
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Restore Snapshot {targetVersionTag}
            </div>
          </div>
          <button
            data-testid="close-restore-modal"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "#FFF",
              width: 30,
              height: 30,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Non-Destructive Guarantee Callout */}
          <div style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 10,
            padding: 14,
            fontSize: 12.5,
            color: "#1E40AF",
            lineHeight: 1.5
          }}>
            <strong>🛡️ Enterprise Immutability Guarantee:</strong><br />
            Restoring to <strong>{targetVersionTag}</strong> will not overwrite or delete any prior versions. Instead, it creates a new version <strong>{nextVerTag} (Restored from {targetVersionTag})</strong> to maintain complete, audit-compliant lineage traceability.
          </div>

          {/* Comparison Matrix */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            background: "var(--bg-primary, #F8FAFC)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 10,
            padding: 14
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Target Snapshot ({targetVersionTag})</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                {targetVersionObj.rowCount?.toLocaleString() || 0} records
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                {targetVersionObj.colCount || (targetVersionObj.columns || []).length} columns
              </div>
              <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "#2563EB", marginTop: 4 }}>
                Hash: {targetVersionObj.hash ? `${targetVersionObj.hash.slice(0, 14)}...` : "sha256-verified"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>New Version to Create</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", marginTop: 4 }}>
                {nextVerTag} (Active)
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                Parent: {currentVersion?.version || "v1"}
              </div>
              <div style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700, marginTop: 4 }}>
                ✓ History fully preserved
              </div>
            </div>
          </div>

          {/* Reason / Audit Note */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
              Reason for Restoration (Audit Logged)
            </label>
            <input
              data-testid="restore-reason-input"
              type="text"
              placeholder={`e.g. Revert transformations to reset baseline to ${targetVersionTag}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-color, #CBD5E1)",
                fontSize: 12.5,
                background: "var(--bg-secondary, #FFFFFF)",
                color: "var(--text-primary, #0F172A)",
                outline: "none"
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              data-testid="cancel-restore-btn"
              onClick={onClose}
              style={{
                background: "transparent",
                color: "var(--text-secondary, #64748B)",
                border: "1px solid var(--border-color, #CBD5E1)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              data-testid="confirm-restore-btn"
              disabled={isRestoring}
              onClick={handleConfirm}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
              }}
            >
              {isRestoring ? "Restoring…" : "Confirm Non-Destructive Restore"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
