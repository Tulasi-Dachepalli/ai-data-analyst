// src/components/lineage/LineageGraph.jsx
import React, { useState } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";
import { useDecision } from "../../context/DecisionContext";
import VersionRestoreModal from "./VersionRestoreModal";

export default function LineageGraph() {
  const { currentVersion, rawVersion, activeDataset, history = [], activeRows, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();
  const { decisions = [] } = useDecision();

  const [selectedNodeId, setSelectedNodeId] = useState("v1");
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTargetVersion, setRestoreTargetVersion] = useState("v1");

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Workspace Dataset";
  const rowCount = activeRows ? activeRows.length : (activeDataset?.rowCount || 0);

  // Build dynamic nodes from history or active dataset
  const nodes = history.length > 0 ? history.flatMap((item, idx) => {
    const list = [];
    if (idx === 0) {
      list.push({
        id: "v1",
        versionTag: "v1",
        isVersion: true,
        label: `v1 Raw Data (${datasetName})`,
        type: "raw",
        desc: `Immutable Raw Dataset (${item.hash || activeDataset?.rawHash || "sha256-v1"})`,
        hash: item.hash || activeDataset?.rawHash || "sha256-v1-canonical-root",
        date: new Date(item.createdAt || item.timestamp || Date.now()).toLocaleTimeString(),
        affectedRows: item.rows ? item.rows.length : rowCount,
        colCount: item.columns ? item.columns.length : (activeDataset?.columns || []).length,
        status: "🔒 Immutable Raw Baseline",
        decisionId: "dec-root-upload",
        decisionTitle: "Initial Immutable Dataset Ingestion"
      });
    } else {
      const opName = item.operationType || (item.transformations && item.transformations[0]?.operation) || `Transformation #${idx}`;
      const reason = item.reason || (item.transformations && item.transformations[0]?.reason) || `Applied ${opName} cleaning step`;
      const linkedDec = decisions.find(d => d.datasetVersion === `v${idx + 1}` || d.status === "applied");

      list.push({
        id: `op-${idx}`,
        isVersion: false,
        label: opName,
        type: "op",
        desc: reason,
        hash: item.hash || `sha256-op-${idx}`,
        date: new Date(item.createdAt || item.timestamp || Date.now()).toLocaleTimeString(),
        affectedRows: item.affectedRowsCount || item.affectedRows || 0,
        before: item.beforeSample || "v1 state",
        after: item.afterSample || `v${idx + 1} state`,
        decisionId: linkedDec ? linkedDec.decisionId || linkedDec.id : `dec-auto-op-${idx}`,
        decisionTitle: linkedDec ? linkedDec.title : "Automated Pipeline Cleaning Operation"
      });

      const isCurrent = idx === history.length - 1;
      list.push({
        id: `v${idx + 1}`,
        versionTag: `v${idx + 1}`,
        isVersion: true,
        label: `v${idx + 1} Stack (${item.label || item.versionName || "Cleaned"})`,
        type: isCurrent ? "current" : "version",
        desc: item.label || `Lineage Version v${idx + 1}`,
        hash: item.hash || `sha256-v${idx + 1}-verified`,
        date: new Date(item.createdAt || item.timestamp || Date.now()).toLocaleTimeString(),
        affectedRows: item.rows ? item.rows.length : rowCount,
        colCount: item.columns ? item.columns.length : 0,
        status: isCurrent ? "● Active Baseline" : "○ Historical Snapshot",
        decisionId: linkedDec ? linkedDec.decisionId || linkedDec.id : `dec-v${idx + 1}`,
        decisionTitle: linkedDec ? linkedDec.title : `Version v${idx + 1} Decision Snapshot`
      });
    }
    return list;
  }) : [
    {
      id: "v1",
      versionTag: "v1",
      isVersion: true,
      label: `v1 Raw Data (${datasetName})`,
      type: "raw",
      desc: `Immutable Raw Dataset (${activeDataset?.rawHash || "sha256-raw"})`,
      hash: activeDataset?.rawHash || "sha256-raw-root",
      date: new Date().toLocaleTimeString(),
      affectedRows: rowCount,
      colCount: (activeDataset?.columns || []).length,
      status: "🔒 Immutable Raw Baseline",
      decisionId: "dec-root-upload",
      decisionTitle: "Initial Immutable Dataset Ingestion"
    }
  ];

  const currentNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
  const activeVersionTag = currentVersion?.version || "v1";

  const handleOpenRestore = (verTag) => {
    setRestoreTargetVersion(verTag);
    setRestoreModalOpen(true);
  };

  return (
    <div data-testid="lineage-graph-container" style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 2px 8px rgba(15,23,42,0.03)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            🧬 VISUAL DATA LINEAGE GRAPH & STACK ENGINE
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary, #64748B)" }}>
            Traceable version tree from raw upload v1 through active version {activeVersionTag}.
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", background: "#F0FDF4", padding: "4px 10px", borderRadius: 12, border: "1px solid #BBF7D0" }}>
          ✓ Deterministic SHA-256 Hash Grounded
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Graph Tree Node Stream */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 14,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          minHeight: 380,
          overflowY: "auto"
        }}>
          {nodes.map((node, i) => {
            const isSelected = selectedNodeId === node.id;
            const isVersion = node.isVersion;
            const isCurrentActive = node.versionTag === activeVersionTag;

            return (
              <React.Fragment key={node.id}>
                <div
                  data-testid={`lineage-node-${node.id}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    background: isSelected
                      ? "#2563EB"
                      : isVersion
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isSelected ? "#60A5FA" : isCurrentActive ? "#34D399" : "rgba(255,255,255,0.18)"}`,
                    color: "#FFFFFF",
                    borderRadius: 10,
                    padding: "12px 18px",
                    width: "100%",
                    maxWidth: 340,
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{isVersion ? "📦" : "⚙️"}</span>
                      <span>{node.label}</span>
                    </div>
                    {isCurrentActive && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#10B981", color: "#FFF", padding: "1px 6px", borderRadius: 4 }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{node.desc}</div>
                  <div style={{ fontSize: 10, color: "#60A5FA", fontFamily: "monospace", marginTop: 2 }}>
                    {node.hash.slice(0, 18)}...
                  </div>
                </div>

                {i < nodes.length - 1 && (
                  <div style={{ color: "#38BDF8", fontWeight: 800, fontSize: 14 }}>│</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Selected Node Details Inspector */}
        <div data-testid="lineage-node-inspector" style={{ border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 12, padding: 18, background: "var(--bg-primary, #F8FAFC)", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Lineage Node Inspector
          </div>

          <div data-testid="lineage-node-tag" style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            {currentNode.label}
          </div>

          <div style={{ fontSize: 12, color: "var(--text-secondary, #475569)" }}>
            {currentNode.desc}
          </div>

          <div style={{ background: "var(--bg-secondary, #FFFFFF)", border: "1px solid var(--border-color, #E2E8F0)", borderRadius: 8, padding: 12, fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div><strong>Timestamp:</strong> {currentNode.date}</div>
            <div><strong>Affected Rows:</strong> {currentNode.affectedRows}</div>
            {currentNode.colCount !== undefined && <div><strong>Columns:</strong> {currentNode.colCount}</div>}
            <div>
              <strong>SHA-256 Hash:</strong>
              <div data-testid="lineage-node-hash" style={{ fontFamily: "monospace", fontSize: 11, color: "#2563EB", background: "#EFF6FF", padding: "3px 6px", borderRadius: 4, marginTop: 2, wordBreak: "break-all" }}>
                {currentNode.hash}
              </div>
            </div>
            {currentNode.decisionId && (
              <div>
                <strong>Linked Decision:</strong>
                <div data-testid="lineage-node-decision" style={{ fontSize: 11.5, color: "#0F172A", marginTop: 2 }}>
                  <code>{currentNode.decisionId}</code> — {currentNode.decisionTitle}
                </div>
              </div>
            )}
            {currentNode.status && (
              <div>
                <strong>Status:</strong>{" "}
                <span data-testid="lineage-node-status" style={{ color: "#16A34A", fontWeight: 700 }}>
                  {currentNode.status}
                </span>
              </div>
            )}
          </div>

          {currentNode.before && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: 8, borderRadius: 6, color: "#991B1B" }}>
                <strong>Before State:</strong> {typeof currentNode.before === "object" ? JSON.stringify(currentNode.before) : currentNode.before}
              </div>
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: 8, borderRadius: 6, color: "#166534" }}>
                <strong>After State:</strong> {typeof currentNode.after === "object" ? JSON.stringify(currentNode.after) : currentNode.after}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {currentNode.isVersion && (
              <button
                data-testid="lineage-restore-btn"
                onClick={() => handleOpenRestore(currentNode.versionTag)}
                style={{
                  background: currentNode.versionTag === activeVersionTag ? "#94A3B8" : "#2563EB",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "9px",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: currentNode.versionTag === activeVersionTag ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span>↺</span>
                <span>{currentNode.versionTag === activeVersionTag ? "Current Active Version" : `Restore to ${currentNode.versionTag}`}</span>
              </button>
            )}

            <button
              data-testid="lineage-inspect-btn"
              onClick={() => openInvestigation({
                title: `Node Evidence: ${currentNode.label}`,
                question: `What changes were made in lineage step ${currentNode.label}?`,
                affectedRows: currentNode.affectedRows,
                findings: [currentNode.desc, currentNode.before ? `Before: ${JSON.stringify(currentNode.before)} -> After: ${JSON.stringify(currentNode.after)}` : "Initial upload"]
              })}
              style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🔬 View Node Evidence
            </button>

            <button
              data-testid="lineage-ask-copilot-btn"
              onClick={() => askQuestion && askQuestion(`Explain lineage transformation ${currentNode.label}`)}
              style={{ background: "#F1F5F9", color: "#0F172A", border: "1px solid #CBD5E1", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🤖 Ask Copilot About Node
            </button>
          </div>
        </div>
      </div>

      {/* Non-Destructive Version Restore Modal */}
      <VersionRestoreModal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        targetVersionTag={restoreTargetVersion}
      />
    </div>
  );
}
