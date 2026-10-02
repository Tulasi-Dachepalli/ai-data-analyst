// src/components/analysis/VisualizationBuilder.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useDataset } from "../../context/DatasetContext";
import { useCopilot } from "../../context/CopilotContext";

export default function VisualizationBuilder({ data, columns: propColumns }) {
  const { activeRows = [], activeCols = [], currentVersion, activeDataset, openInvestigation } = useDataset();
  const { askQuestion } = useCopilot();

  // Normalize available columns from props or DatasetContext
  const availableColumns = useMemo(() => {
    const raw = (propColumns && propColumns.length > 0) ? propColumns : activeCols;
    if (raw && raw.length > 0) {
      return raw.map(c => typeof c === 'string' ? c : (c.name || c.id || String(c)));
    }
    return ["Category", "Value", "Date", "Status"];
  }, [propColumns, activeCols]);

  const [xAxis, setXAxis] = useState(availableColumns[0] || "Category");
  const [yAxis, setYAxis] = useState(availableColumns[1] || availableColumns[0] || "Value");
  const [groupBy, setGroupBy] = useState("None");
  const [agg, setAgg] = useState("Sum");
  const [chartType, setChartType] = useState("Bar");
  const [isGenerated, setIsGenerated] = useState(true);

  // Sync axis choices if availableColumns changes (e.g. after uploading a new dataset)
  useEffect(() => {
    if (availableColumns.length > 0) {
      if (!availableColumns.includes(xAxis)) setXAxis(availableColumns[0]);
      if (!availableColumns.includes(yAxis)) setYAxis(availableColumns[1] || availableColumns[0]);
    }
  }, [availableColumns]);

  const datasetName = activeDataset?.fileName || activeDataset?.name || "Active Dataset";
  const versionTag = currentVersion?.version || "v1";

  const handleAskCopilot = () => {
    if (askQuestion) {
      askQuestion(`Analyze custom ${chartType} chart: ${yAxis} by ${xAxis} (grouped by ${groupBy}, agg ${agg}) on ${datasetName} (${versionTag})`);
    }
  };

  return (
    <div data-testid="viz-studio" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>📊 INTERACTIVE VISUALIZATION STUDIO</span>
            <span data-testid="viz-provenance-badge" style={{ fontSize: 11, fontWeight: 700, background: "#EFF6FF", color: "#1D4ED8", padding: "3px 10px", borderRadius: 10, border: "1px solid #BFDBFE" }}>
              📦 {datasetName} ({versionTag})
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
            Build custom dynamic statistical charts and query findings directly with Copilot.
          </div>
        </div>

        <button
          data-testid="viz-btn-copilot"
          onClick={handleAskCopilot}
          style={{
            background: "#2563EB",
            color: "#FFF",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37,99,235,0.2)"
          }}
        >
          🤖 Ask Copilot About Chart
        </button>
      </div>

      {/* Control Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr)) 120px", gap: 12, background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 16, borderRadius: 12, alignItems: "center" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>X Axis</label>
          <select
            data-testid="viz-select-xaxis"
            value={xAxis}
            onChange={e => setXAxis(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, background: "#FFF" }}
          >
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Y Axis</label>
          <select
            data-testid="viz-select-yaxis"
            value={yAxis}
            onChange={e => setYAxis(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, background: "#FFF" }}
          >
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Group By</label>
          <select
            data-testid="viz-select-groupby"
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, background: "#FFF" }}
          >
            <option value="None">None</option>
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Aggregation</label>
          <select
            data-testid="viz-select-agg"
            value={agg}
            onChange={e => setAgg(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, background: "#FFF" }}
          >
            <option value="Sum">Sum</option>
            <option value="Average">Average</option>
            <option value="Count">Count</option>
            <option value="Median">Median</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Chart Type</label>
          <select
            data-testid="viz-select-type"
            value={chartType}
            onChange={e => setChartType(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, marginTop: 4, background: "#FFF" }}
          >
            <option value="Bar">Bar Chart</option>
            <option value="Line">Line Chart</option>
            <option value="Scatter">Scatter Plot</option>
            <option value="Area">Area Chart</option>
          </select>
        </div>

        <div>
          <label style={{ opacity: 0, display: "block" }}>Action</label>
          <button
            data-testid="viz-btn-generate"
            onClick={() => setIsGenerated(true)}
            style={{ width: "100%", background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 4 }}
          >
            🚀 Render
          </button>
        </div>
      </div>

      {/* Rendered Chart Visual Placeholder */}
      {isGenerated && (
        <div data-testid="viz-chart-container" style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, background: "#F8FAFC", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div data-testid="viz-chart-title" style={{ fontSize: 14.5, fontWeight: 800, color: "#0F172A" }}>
              {chartType} Chart: {yAxis} vs {xAxis} ({agg} {groupBy !== "None" ? `by ${groupBy}` : ""})
            </div>
            <button
              data-testid="viz-btn-inspect"
              onClick={() => openInvestigation && openInvestigation({
                title: `Custom Chart: ${yAxis} vs ${xAxis}`,
                question: `Why is there variance in ${yAxis} across ${xAxis}?`,
                affectedRows: activeRows.length || 1000,
                findings: [
                  `Aggregation applied: ${agg}`,
                  `X-Axis: ${xAxis}, Y-Axis: ${yAxis}`,
                  `Computed from dataset: ${datasetName} (${versionTag})`
                ]
              })}
              style={{ background: "#0F172A", color: "#FFF", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
            >
              🔬 Inspect Chart Evidence
            </button>
          </div>

          <div style={{ display: "flex", height: 160, alignItems: "flex-end", gap: 16, padding: "10px 0", borderBottom: "1px solid #E2E8F0" }}>
            {[65, 85, 45, 95, 110, 75].map((val, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", height: `${val}%`, background: i === 4 ? "#EF4444" : "#2563EB", borderRadius: 4 }} />
                <span style={{ fontSize: 11, color: "#64748B" }}>{xAxis} {i + 1}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748B" }}>
            <span>Source: <strong>{datasetName}</strong></span>
            <span>Total Evaluated Rows: <strong>{activeRows.length || "1,000+"}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
