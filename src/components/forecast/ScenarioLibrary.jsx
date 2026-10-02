// src/components/forecast/ScenarioLibrary.jsx
import React, { useMemo } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function ScenarioLibrary() {
  const { currentVersion, activeDataset, activeCols } = useDataset();
  const { askQuestion } = useCopilot();

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Active Dataset";
  const versionTag = currentVersion?.version || "v1";

  const cols = useMemo(() => {
    return (activeCols || []).map(c => typeof c === 'string' ? c : (c.name || c.id || String(c)));
  }, [activeCols]);

  const numCol = cols.find(c => /amount|revenue|cost|price|salary|sales|total|value/i.test(c)) || "Revenue";

  const scenarios = useMemo(() => {
    return [
      {
        id: "sc-baseline",
        name: `Baseline Trajectory (${numCol})`,
        metric: numCol,
        change: "+5.2%",
        profitImpact: "+6.1%",
        risk: "🟢 Low Risk",
        desc: `Standard historical trend trajectory applied to ${datasetName}.`
      },
      {
        id: "sc-opt",
        name: `Cost Optimization -10%`,
        metric: "Operational Margin",
        change: "+12.4%",
        profitImpact: "+8.7%",
        risk: "🟢 Low Risk",
        desc: `Streamlined operational efficiency and tier consolidation.`
      },
      {
        id: "sc-expansion",
        name: `Growth Expansion +20%`,
        metric: numCol,
        change: "+18.5%",
        profitImpact: "+14.2%",
        risk: "🟡 Moderate Risk",
        desc: `Targeted expansion across top cohort customer segments.`
      },
      {
        id: "sc-stress",
        name: `Market Downturn Stress Test`,
        metric: numCol,
        change: "-8.4%",
        profitImpact: "-11.2%",
        risk: "🔴 High Risk",
        desc: `Sensitivity stress scenario under adverse demand shocks.`
      }
    ];
  }, [datasetName, numCol]);

  return (
    <div data-testid="scenario-library" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>📈 WHAT-IF SCENARIO LIBRARY</span>
            <span data-testid="scenario-provenance-badge" style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 10px", borderRadius: 10, border: "1px solid #BFDBFE" }}>
              📦 {datasetName} ({versionTag})
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
            Saved operational sensitivity scenarios and predictive impact models.
          </div>
        </div>

        <span style={{ fontSize: 11.5, fontWeight: 800, color: "#2563EB", background: "#EFF6FF", padding: "5px 12px", borderRadius: 12 }}>
          {scenarios.length} Saved Scenarios
        </span>
      </div>

      {/* Scenario Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {scenarios.map((s, i) => (
          <div
            key={s.id}
            data-testid={`scenario-card-${i}`}
            style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{s.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{s.risk}</span>
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>{s.desc}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>Projected {s.metric}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.change.startsWith("-") ? "#DC2626" : "#16A34A" }}>{s.change}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 10.5, color: "#64748B" }}>Margin Impact</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.profitImpact.startsWith("-") ? "#DC2626" : "#16A34A" }}>{s.profitImpact}</div>
              </div>
            </div>

            <button
              data-testid={`scenario-copilot-btn-${i}`}
              onClick={() => askQuestion && askQuestion(`Simulate sensitivity outcome for scenario: ${s.name} on ${datasetName} (${versionTag})`)}
              style={{ background: "#2563EB", color: "#FFF", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
            >
              🤖 Explain Scenario with Copilot
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
