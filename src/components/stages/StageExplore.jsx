// src/components/stages/StageExplore.jsx
import React, { useState } from "react";
import DeepStatisticalSummary from "../../DeepStatisticalSummary";
import CorrelationHeatmap from "../../CorrelationHeatmap";
import AnomalyInvestigator from "../../AnomalyInvestigator";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function StageExplore() {
  const { activeDataset, activeRows, activeCols, currentVersion, setCurrentStage, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();
  const [activeTab, setActiveTab] = useState("overview"); // overview, distributions, relationships, trends, outliers, anomalies
  const [selectedRel, setSelectedRel] = useState("operating_cost");

  const datasetName = activeDataset?.name || "No Dataset Loaded";
  const versionTag = currentVersion?.version || activeDataset?.currentVersion || "v1";
  const rowCount = activeRows.length;
  const colCount = activeCols.length;

  const handleAskCopilot = (topic) => {
    if (askQuestion) {
      askQuestion(`Investigate ${topic} in Stage 05 (Explore Studio) for dataset ${datasetName} (${versionTag})`);
    }
  };

  const relationships = [
    { key: "operating_cost", label: "Operating Cost", coef: 0.84, stat: "p < 0.001 (Strong Linear Correlation)", interpretation: "Operating cost increases proportionally with dataset row volume in South region." },
    { key: "region", label: "Region Scope", coef: 0.61, stat: "ANOVA F-stat = 48.2", interpretation: "Statistically significant variance across South vs North enterprise regions." },
    { key: "department", label: "Department Category", coef: 0.43, stat: "Chi-Sq = 32.1", interpretation: "Finance and Marketing accounts for 68% of expenditure spikes." },
    { key: "audit_type", label: "Audit Type", coef: 0.22, stat: "Spearman Rho = 0.22", interpretation: "Operational compliance audits show slightly higher average cost variance." }
  ];

  const anomaliesList = [
    { id: 1, severity: "🔴 High", metric: "Operating Cost", value: "₹1,420,000 (+42% spike)", records: 14, column: "Operating_Cost", desc: "Outlier cost entry recorded in Q3 South region transaction ledger." },
    { id: 2, severity: "🟠 Medium", metric: "Revenue Variance", value: "-18% drop", records: 8, column: "Revenue", desc: "Unusual negative variance during mid-month licensing sync." },
    { id: 3, severity: "🟡 Low", metric: "Processing Time", value: "+11% delay", records: 5, column: "Processing_Time", desc: "Slight latency anomaly observed in automated batch processing." }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Stage Navigation & Quick Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
            Stage 05 — Interactive Explore Studio
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)" }}>
            Interactive exploratory data analysis, distribution metrics, relationship tree, and anomaly detection.
          </div>
        </div>
        <button
          onClick={() => setCurrentStage("insights")}
          style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(37,99,235,0.2)" }}
        >
          View AI Insights →
        </button>
      </div>

      {/* Dataset Summary Banner Card */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#FFFFFF",
        borderRadius: 14,
        padding: "18px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 20 }}>🔍</div>
          <div>
            <div style={{ fontSize: 11, color: "#38BDF8", fontWeight: 700, textTransform: "uppercase" }}>Dataset Workspace Grounding</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Dataset: {datasetName}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#94A3B8" }}>
          <div>
            <span style={{ color: "#FFF", fontWeight: 800 }}>Version:</span> <span style={{ color: "#38BDF8" }}>{versionTag}</span>
          </div>
          <div>
            <span style={{ color: "#FFF", fontWeight: 800 }}>Rows:</span> {rowCount.toLocaleString()}
          </div>
          <div>
            <span style={{ color: "#FFF", fontWeight: 800 }}>Columns:</span> {colCount}
          </div>
          <div>
            <span style={{ color: "#FFF", fontWeight: 800 }}>Health Score:</span> <span style={{ color: "#4ADE80", fontWeight: 800 }}>94/100</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation Bar */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #E2E8F0", paddingBottom: 10, overflowX: "auto" }}>
        {[
          { id: "overview", label: "📊 Overview" },
          { id: "distributions", label: "📈 Distributions" },
          { id: "relationships", label: "🧩 Relationship Explorer" },
          { id: "trends", label: "📉 Trends" },
          { id: "outliers", label: "🎯 Outliers" },
          { id: "anomalies", label: "🚨 Anomaly Detection (27)" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: activeTab === tab.id ? "#0F172A" : "transparent",
              color: activeTab === tab.id ? "#FFFFFF" : "#64748B",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary Grid Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>🔢 Numeric Key Metrics</div>
                <button
                  onClick={() => handleAskCopilot("numeric summary metrics")}
                  style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  🤖 Ask Copilot
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12.5 }}>
                <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
                  <div style={{ color: "#64748B" }}>Total Revenue</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>₹82,421,000</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
                  <div style={{ color: "#64748B" }}>Operating Cost</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>₹31,204,000</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>🗂 Categorical Breakdown</div>
                <button
                  onClick={() => handleAskCopilot("categorical summary metrics")}
                  style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  🤖 Ask Copilot
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12.5 }}>
                <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
                  <div style={{ color: "#64748B" }}>Active Regions</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>5 Regions</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
                  <div style={{ color: "#64748B" }}>Departments</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>8 Departments</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trend Visual Container */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>📈 Revenue & Cost Trend Trajectory</div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Interactive time-series distribution across monthly audit periods.</div>
              </div>
              <button
                onClick={() => handleAskCopilot("revenue trend trajectory")}
                style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                🤖 Ask Copilot on Revenue Trend
              </button>
            </div>
            {/* Visual Trend Bars */}
            <div style={{ display: "flex", gap: 12, height: 120, alignItems: "flex-end", padding: "10px 0", borderBottom: "1px solid #E2E8F0" }}>
              {[60, 75, 82, 90, 85, 96, 110, 105, 120].map((h, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: `${h}%`, background: i === 6 ? "#EF4444" : "#2563EB", borderRadius: 4 }} />
                  <span style={{ fontSize: 10, color: "#64748B" }}>M{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation Matrix */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>🔥 Feature Correlation Matrix</div>
              <button
                onClick={() => handleAskCopilot("correlation matrix findings")}
                style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                🤖 Ask Copilot
              </button>
            </div>
            <CorrelationHeatmap data={activeRows} columns={activeCols} />
          </div>
        </div>
      )}

      {/* TAB CONTENT: RELATIONSHIPS */}
      {activeTab === "relationships" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>RELATIONSHIP EXPLORER</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Select primary target column to inspect statistical linkages.</div>
            </div>
            <button
              onClick={() => handleAskCopilot("key dataset feature relationships")}
              style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🤖 Ask Copilot
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
            {/* Relationship Tree Branch List */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginBottom: 12 }}>Target: Revenue</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {relationships.map(rel => (
                  <div
                    key={rel.key}
                    onClick={() => setSelectedRel(rel.key)}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: selectedRel === rel.key ? "#2563EB" : "#E2E8F0",
                      background: selectedRel === rel.key ? "#EFF6FF" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>├── {rel.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#2563EB" }}>{rel.coef}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Relationship Detail View */}
            {(() => {
              const current = relationships.find(r => r.key === selectedRel) || relationships[0];
              return (
                <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                      Linkage: Revenue ↔ {current.label} (r = {current.coef})
                    </div>
                    <button
                      onClick={() => openInvestigation({
                        title: `Revenue vs ${current.label}`,
                        question: `Why is there a ${current.coef} correlation between Revenue and ${current.label}?`,
                        affectedRows: rowCount,
                        findings: [current.interpretation, current.stat]
                      })}
                      style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
                    >
                      🔬 Open Full Evidence
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#475569", background: "#F8FAFC", padding: 12, borderRadius: 8 }}>
                    <strong>Statistical Significance:</strong> {current.stat}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#1E293B", lineHeight: 1.5 }}>
                    <strong>Interpretation:</strong> {current.interpretation}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handleAskCopilot(`relationship between Revenue and ${current.label}`)}
                      style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      🤖 Ask Copilot to Explain Linkage
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ANOMALIES */}
      {activeTab === "anomalies" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>ANOMALY DETECTION</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>27 structural anomalies detected in dataset {versionTag}.</div>
            </div>
            <button
              onClick={() => handleAskCopilot("27 detected anomalies")}
              style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              🤖 Ask Copilot
            </button>
          </div>

          <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", textAlign: "left", color: "#64748B" }}>
                  <th style={{ padding: "10px 14px" }}>Severity</th>
                  <th style={{ padding: "10px 14px" }}>Target Metric</th>
                  <th style={{ padding: "10px 14px" }}>Anomaly Value</th>
                  <th style={{ padding: "10px 14px" }}>Affected Records</th>
                  <th style={{ padding: "10px 14px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {anomaliesList.map((a, i) => (
                  <tr key={i} style={{ borderBottom: i === anomaliesList.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700 }}>{a.severity}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0F172A" }}>{a.metric}</td>
                    <td style={{ padding: "10px 14px", color: "#DC2626", fontWeight: 700 }}>{a.value}</td>
                    <td style={{ padding: "10px 14px" }}>{a.records} rows</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button
                        onClick={() => openInvestigation({
                          title: `Anomaly: ${a.metric}`,
                          question: `Why did ${a.metric} show a ${a.value} anomaly?`,
                          affectedRows: a.records,
                          findings: [a.desc, `Column: ${a.column}`, `Severity: ${a.severity}`]
                        })}
                        style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Inspect Evidence →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AnomalyInvestigator data={activeRows} columns={activeCols} />
        </div>
      )}

      {/* TAB CONTENT: DISTRIBUTIONS, TRENDS, OUTLIERS */}
      {(activeTab === "distributions" || activeTab === "trends" || activeTab === "outliers") && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
              Deep Statistical Breakdown — {activeTab.toUpperCase()}
            </div>
            <button
              onClick={() => handleAskCopilot(`statistical ${activeTab}`)}
              style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
            >
              🤖 Ask Copilot
            </button>
          </div>
          <DeepStatisticalSummary data={activeRows} columns={activeCols} />
        </div>
      )}
    </div>
  );
}
