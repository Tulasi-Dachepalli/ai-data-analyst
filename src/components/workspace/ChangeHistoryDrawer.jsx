// src/components/workspace/ChangeHistoryDrawer.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";

export default function ChangeHistoryDrawer({ isOpen, onClose }) {
  const { versionStack, currentVersion, rawVersion, history, versionDiff } = useDataset();
  const [showDiff, setShowDiff] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "flex-end"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "var(--bg-secondary, #FFFFFF)",
        height: "100vh",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #E2E8F0)", paddingBottom: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>📜 Change History & Lineage</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)" }}>
              Dataset: {currentVersion?.datasetName || "Active Dataset"} • Current: {currentVersion?.version || "v1"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}>✕</button>
        </div>

        {/* Current Version Summary Card */}
        <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#FFF", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: "#2563EB", color: "#FFF", padding: "2px 8px", borderRadius: 10 }}>
              CURRENT VERSION
            </span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{currentVersion?.version || "v1"}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {currentVersion?.rowCount || 0} rows × {currentVersion?.colCount || 0} columns
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8" }}>
            Hash: {currentVersion?.hash || "N/A"}
          </div>
        </div>

        {/* Compare v1 ↔ vN Trigger Button */}
        {versionDiff && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setShowDiff(!showDiff)}
              style={{
                width: "100%",
                background: "var(--bg-primary, #F8FAFC)",
                border: "1px solid var(--border-color, #CBD5E1)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary, #0F172A)",
                cursor: "pointer",
                display: "flex",
                justify: "space-between",
                alignItems: "center"
              }}
            >
              <span>📊 Compare {versionDiff.versionA} ↔ {versionDiff.versionB}</span>
              <span>{showDiff ? "▲ Hide Diff" : "▼ View Diff"}</span>
            </button>

            {showDiff && (
              <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 10, padding: 14, marginTop: 8, fontSize: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ background: "rgba(239, 68, 68, 0.05)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 700 }}>RAW ROWS (v1)</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{versionDiff.rowsA}</div>
                  </div>
                  <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: 8, borderRadius: 6, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>CURRENT ROWS ({versionDiff.versionB})</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{versionDiff.rowsB}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary, #475569)", lineHeight: 1.6 }}>
                  <div>• <strong>Row Diff:</strong> {versionDiff.rowDiff} rows</div>
                  <div>• <strong>Missing Resolved:</strong> {versionDiff.missingResolved} cells</div>
                  <div>• <strong>Transformations Applied:</strong> {versionDiff.transformationsApplied}</div>
                  <div>• <strong>Raw Immutability Check:</strong> {versionDiff.isRawImmutable ? "✓ 100% Locked & Valid" : "Warning"}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Version History Stack Timeline */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0F172A)", marginBottom: 12 }}>
          Transformation Stack ({history.length})
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.map((ver, idx) => (
            <div
              key={ver.version}
              style={{
                background: "var(--bg-primary, #F8FAFC)",
                border: "1px solid var(--border-color, #E2E8F0)",
                borderRadius: 10,
                padding: 14,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0F172A)" }}>
                  {ver.version} — {ver.label}
                </span>
                {ver.immutable && (
                  <span style={{ fontSize: 10, background: "#FEF3C7", color: "#B45309", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                    🔒 Immutable Raw
                  </span>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", marginBottom: 4 }}>
                {ver.rowCount} rows × {ver.colCount} columns
              </div>

              {ver.transformations && ver.transformations.length > 0 && (
                <div style={{ marginTop: 8, background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: 8, fontSize: 11 }}>
                  {ver.transformations.map(tx => (
                    <div key={tx.id}>
                      <div style={{ fontWeight: 700, color: "#2563EB" }}>Why: {tx.reason}</div>
                      <div style={{ color: "#475569" }}>Method: {tx.method}</div>
                      <div style={{ color: "#94A3B8", marginTop: 2 }}>{tx.affectedRows} rows affected</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
