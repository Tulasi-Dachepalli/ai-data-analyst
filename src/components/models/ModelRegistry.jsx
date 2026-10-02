// src/components/models/ModelRegistry.jsx
import React, { useState, useMemo } from "react";
import { useDataset } from "../../context/DatasetContext";
import { getDynamicRegisteredModels } from "../../services/modelRegistryService";

export default function ModelRegistry() {
  const { currentVersion, activeDataset, activeCols, openInvestigation } = useDataset();
  const [selectedModel, setSelectedModel] = useState(null);

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Active Dataset";
  const versionTag = currentVersion?.version || "v1";

  const models = useMemo(() => {
    const datasetObj = activeDataset || {
      name: datasetName,
      fileName: datasetName,
      columns: activeCols || ["category", "amount"]
    };
    return getDynamicRegisteredModels(datasetObj, currentVersion);
  }, [activeDataset, activeCols, currentVersion, datasetName, versionTag]);

  return (
    <div data-testid="model-registry" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>🧪 DATA SCIENCE MODEL REGISTRY</span>
            <span data-testid="model-provenance-badge" style={{ fontSize: 11, fontWeight: 700, background: "#F0FDF4", color: "#15803D", padding: "3px 10px", borderRadius: 10, border: "1px solid #BBF7D0" }}>
              📦 {datasetName} ({versionTag})
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
            Trained ML model candidates, version tags, evaluation metrics, and hyperparameter provenance.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#16A34A", background: "#F0FDF4", padding: "5px 12px", borderRadius: 12 }}>
            {models.length} Registered Candidates
          </span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
              <th style={{ padding: "12px 14px" }}>Model Name</th>
              <th style={{ padding: "12px 14px" }}>Version</th>
              <th style={{ padding: "12px 14px" }}>Target Column</th>
              <th style={{ padding: "12px 14px" }}>Feature Predictors</th>
              <th style={{ padding: "12px 14px" }}>R² Score</th>
              <th style={{ padding: "12px 14px" }}>RMSE</th>
              <th style={{ padding: "12px 14px" }}>Status</th>
              <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.id} data-testid={`model-row-${i}`} style={{ borderBottom: i === models.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>{m.name}</td>
                <td style={{ padding: "12px 14px", color: "#64748B" }}>{m.version}</td>
                <td data-testid="model-target-col" style={{ padding: "12px 14px", fontWeight: 700, color: "#2563EB" }}>
                  <code>{m.target}</code>
                </td>
                <td data-testid="model-features-col" style={{ padding: "12px 14px", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.features}
                </td>
                <td style={{ padding: "12px 14px", fontWeight: 800, color: "#16A34A" }}>{m.r2}</td>
                <td style={{ padding: "12px 14px", color: "#334155" }}>{m.rmse}</td>
                <td style={{ padding: "12px 14px" }}>
                  <span data-testid="model-status-badge" style={{ fontSize: 11, fontWeight: 700, background: m.status.includes("Candidate") ? "#FEF3C7" : "#F1F5F9", color: m.status.includes("Candidate") ? "#92400E" : "#0F172A", padding: "3px 8px", borderRadius: 8 }}>
                    {m.status}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <button
                    data-testid={`model-inspect-btn-${i}`}
                    onClick={() => {
                      setSelectedModel(m);
                      if (openInvestigation) {
                        openInvestigation({
                          title: `Model Evaluation: ${m.name}`,
                          question: `How does ${m.name} predict ${m.target}?`,
                          affectedRows: 1000,
                          findings: [
                            `Target Variable: ${m.target}`,
                            `Predictors: ${m.features}`,
                            `R² Performance: ${m.r2} (RMSE: ${m.rmse})`,
                            `Dataset Raw Hash: ${m.rawHash.slice(0, 12)}...`
                          ]
                        });
                      }
                    }}
                    style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Model Details Drawer / Footer */}
      {selectedModel && (
        <div style={{ background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>🔬 Selected Model Provenance: {selectedModel.name}</span>
            <span style={{ fontSize: 11, color: "#64748B" }}>Author: {selectedModel.author}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, fontSize: 12 }}>
            <div style={{ background: "#FFF", padding: 10, borderRadius: 6, border: "1px solid #E2E8F0" }}>
              <div style={{ color: "#64748B", fontSize: 10.5 }}>Cross-Validation Score</div>
              <div style={{ fontWeight: 800, color: "#16A34A" }}>{selectedModel.cvScore}</div>
            </div>
            <div style={{ background: "#FFF", padding: 10, borderRadius: 6, border: "1px solid #E2E8F0" }}>
              <div style={{ color: "#64748B", fontSize: 10.5 }}>Hyperparameters</div>
              <code style={{ fontSize: 11 }}>{JSON.stringify(selectedModel.hyperparameters)}</code>
            </div>
            <div style={{ background: "#FFF", padding: 10, borderRadius: 6, border: "1px solid #E2E8F0" }}>
              <div style={{ color: "#64748B", fontSize: 10.5 }}>Dataset SHA Checksum</div>
              <span style={{ fontSize: 11, fontFamily: "monospace" }}>{selectedModel.rawHash.slice(0, 16)}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
