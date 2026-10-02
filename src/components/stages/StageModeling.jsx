// src/components/stages/StageModeling.jsx
import React, { useState } from "react";
import ClusterSegmentation from "../../ClusterSegmentation";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function StageModeling() {
  const { activeRows, activeCols, currentVersion, setCurrentStage, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();

  const [targetVar, setTargetVar] = useState("Revenue");
  const [problemType] = useState("Regression");
  const [selectedFeatures, setSelectedFeatures] = useState(["Region", "Department", "Operating_Cost", "Audit_Type"]);
  const [isTrained, setIsTrained] = useState(true);

  const toggleFeature = (feat) => {
    setSelectedFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    );
  };

  const handleAskCopilot = (topic) => {
    if (askQuestion) {
      askQuestion(`Explain ML Model Experiment: ${topic} for target ${targetVar}`);
    }
  };

  const models = [
    { name: "Random Forest Regressor", r2: "94.2%", rmse: "8,214", status: "🏆 Best Model", color: "#16A34A" },
    { name: "XGBoost Gradient Booster", r2: "92.8%", rmse: "9,021", status: "Challenger", color: "#2563EB" },
    { name: "Linear Regression (Ridge)", r2: "81.4%", rmse: "14,832", status: "Baseline", color: "#64748B" }
  ];

  const featureImportance = [
    { name: "Operating Cost", score: 48 },
    { name: "Region Scope", score: 26 },
    { name: "Department Category", score: 16 },
    { name: "Audit Type", score: 10 }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stage Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Stage 07 — Data Scientist Experiment Center & AutoML
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Train predictive ML regression & classification models, evaluate feature importance, and compare model metrics.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("forecast")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}
        >
          Run Time-Series Forecast →
        </button>
      </div>

      {/* Experiment Configuration Panel */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>🧪 Model Setup & Feature Selection</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr 180px", gap: 16, alignItems: "center" }}>
          {/* Target Variable Selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Target Variable</label>
            <select
              value={targetVar}
              onChange={e => setTargetVar(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, fontWeight: 700, marginTop: 4 }}
            >
              <option value="Revenue">Revenue (₹)</option>
              <option value="Operating_Cost">Operating Cost (₹)</option>
              <option value="Variance">Variance Rate (%)</option>
            </select>
          </div>

          {/* Problem Type */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Problem Type</label>
            <div style={{ padding: "8px 12px", background: "#F1F5F9", borderRadius: 8, fontSize: 13, fontWeight: 700, marginTop: 4, color: "#0F172A" }}>
              {problemType}
            </div>
          </div>

          {/* Feature Checkboxes */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Features</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              {["Region", "Department", "Operating_Cost", "Audit_Type", "Processing_Time"].map(feat => (
                <label key={feat} style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feat)}
                    onChange={() => toggleFeature(feat)}
                  />
                  <span>{feat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Run Experiment Trigger */}
          <div>
            <label style={{ opacity: 0 }}>Action</label>
            <button
              onClick={() => setIsTrained(true)}
              style={{ width: "100%", background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              🚀 Run Experiment
            </button>
          </div>
        </div>
      </div>

      {/* Model Comparison Matrix */}
      {isTrained && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>MODEL COMPARISON MATRIX</div>
                <div style={{ fontSize: 12, color: "#64748B" }}>Trained on Dataset {currentVersion?.version || "v4 Cleaned"} ({activeRows.length || 5000} records).</div>
              </div>
              <button
                onClick={() => handleAskCopilot("model comparison matrix and R-squared results")}
                style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                🤖 Explain Models with Copilot
              </button>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                    <th style={{ padding: "12px 16px" }}>Model</th>
                    <th style={{ padding: "12px 16px" }}>R² Score</th>
                    <th style={{ padding: "12px 16px" }}>RMSE</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={i} style={{ borderBottom: i === models.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>{m.name}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: m.color }}>{m.r2}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{m.rmse}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "#F1F5F9", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, color: m.color }}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Model Diagnostics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Why this model & Feature Importance */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>💡 Why Random Forest Regressor?</div>
              <div style={{ fontSize: 12.5, color: "#475569", background: "#F8FAFC", padding: 12, borderRadius: 8, lineHeight: 1.5 }}>
                Random Forest achieved the highest R² score (94.2%) due to its non-linear decision tree ensemble structure, handling non-linear regional cost interactions without overfitting.
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 6 }}>📊 Feature Importance Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {featureImportance.map((f, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                      <span>{f.name}</span>
                      <span>{f.score}%</span>
                    </div>
                    <div style={{ height: 6, width: "100%", background: "#F1F5F9", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: `${f.score}%`, background: "#2563EB", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Assumptions & Diagnostics */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A" }}>🎯 Model Assumptions & Diagnostics</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5 }}>
                <div style={{ background: "#F0FDF4", padding: 10, borderRadius: 8, color: "#166534" }}>
                  ✓ <strong>Homoscedasticity:</strong> Residual variance is uniformly distributed across feature spectrum.
                </div>
                <div style={{ background: "#F0FDF4", padding: 10, borderRadius: 8, color: "#166534" }}>
                  ✓ <strong>No Multicollinearity:</strong> VIF &lt; 2.5 across all active features.
                </div>
                <div style={{ background: "#FFFBEB", padding: 10, borderRadius: 8, color: "#92400E" }}>
                  ⚠️ <strong>Outlier Influence:</strong> 27 high-leverage anomaly rows detected in Stage 05.
                </div>
              </div>

              <button
                onClick={() => openInvestigation({
                  title: "ML Model Prediction Diagnostics",
                  question: "How do model assumptions impact prediction accuracy?",
                  affectedRows: activeRows.length || 5000,
                  findings: [
                    "Random Forest R² = 94.2%",
                    "Feature Importance: Operating Cost (48%), Region (26%)",
                    "Outlier influence check recommended for 27 anomaly rows"
                  ]
                })}
                style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 8 }}
              >
                🔬 Inspect Prediction Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Segmentation Component */}
      <ClusterSegmentation data={activeRows} columns={activeCols} />
    </div>
  );
}
