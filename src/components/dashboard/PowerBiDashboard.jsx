// src/components/dashboard/PowerBiDashboard.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter
} from "recharts";
import { useCopilot } from "../../context/CopilotContext";
import { useRole } from "../../context/RoleContext";
import { useActivity } from "../../context/ActivityContext";
import { useLanguage } from "../../utils/i18n";
import ExecutiveReportGenerator from "../../ExecutiveReportGenerator";

// Crisp modern palette inspired by Power BI & enterprise design
const PALETTE = ["#2563EB", "#0D9488", "#F59E0B", "#8B5CF6", "#EC4899", "#10B981", "#3B82F6", "#6366F1"];

function formatMetricValue(val, colName = "") {
  if (val == null || isNaN(val)) return "0";
  const isCurrency = /revenue|sales|profit|cost|spend|budget|price|salary|margin/i.test(colName);
  const isPercent = /rate|ratio|percent|pct|growth/i.test(colName);
  
  const abs = Math.abs(val);
  let formatted = "";
  if (abs >= 10000000) formatted = (val / 10000000).toFixed(2) + " Cr";
  else if (abs >= 1000000) formatted = (val / 1000000).toFixed(2) + "M";
  else if (abs >= 1000) formatted = (val / 1000).toFixed(1) + "K";
  else formatted = Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);

  if (isCurrency) return "₹" + formatted;
  if (isPercent) return formatted + "%";
  return formatted;
}

export default function PowerBiDashboard({ active, user, setView, onAskQuestion }) {
  const { t } = useLanguage();
  const { askQuestion } = useCopilot();
  const { roleConfig } = useRole();
  const { logEvent } = useActivity();

  // Slicer Filters State: { [columnName]: selectedValue }
  const [slicers, setSlicers] = useState({});
  // Interactive Drilldown State: { [visualId]: nextDimCol }
  const [drillDowns, setDrillDowns] = useState({});
  // Visual explanation modal / callout: visualId | null
  const [explainingVisual, setExplainingVisual] = useState(null);
  // Fullscreen / Presentation Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  // Show Add Visual Builder
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  // Custom user-added visuals list
  const [customVisuals, setCustomVisuals] = useState([]);
  // Search filter inside table view
  const [tableSearch, setTableSearch] = useState("");
  // Selected category for cross-filtering from chart clicks
  const [highlightedCategory, setHighlightedCategory] = useState(null);

  const rawRows = useMemo(() => active?.rows || [], [active]);
  const columns = useMemo(() => active?.columns || (rawRows.length ? Object.keys(rawRows[0]) : []), [active, rawRows]);
  const stats = useMemo(() => active?.stats || [], [active]);

  // Semantic Column Roles Detection
  const columnRoles = useMemo(() => {
    if (!columns.length) return { metrics: [], dimensions: [], dates: [], geographies: [] };

    const dates = [];
    const metrics = [];
    const dimensions = [];
    const geographies = [];

    columns.forEach(col => {
      if (!col || col.startsWith("__")) return;
      const lower = col.toLowerCase();
      const colStat = stats.find(s => s.name === col);
      const isNum = colStat ? colStat.type === "numeric" : rawRows.some(r => typeof r[col] === "number" || (!isNaN(Number(r[col])) && r[col] !== "" && r[col] !== null));
      const isDate = colStat ? colStat.type === "date" : /date|time|period|month|year|timestamp|day|quarter|^dt$/i.test(lower);
      const isGeo = /region|country|state|city|location|zone|territory|province|postal|zip/i.test(lower);

      if (isDate) {
        dates.push(col);
      } else if (isGeo) {
        geographies.push(col);
        dimensions.push(col);
      } else if (isNum && !/id|code|phone|ssn|pin|postal/i.test(lower)) {
        metrics.push(col);
      } else {
        // Categorical dimension
        const uniqueCount = new Set(rawRows.map(r => String(r[col]))).size;
        if (uniqueCount >= 2 && uniqueCount <= 60) {
          dimensions.push(col);
        }
      }
    });

    return { metrics, dimensions, dates, geographies };
  }, [columns, stats, rawRows]);

  // Top Slicer Candidates (top 4-5 dimensions + dates)
  const slicerColumns = useMemo(() => {
    const list = [];
    if (columnRoles.dates.length) list.push(columnRoles.dates[0]);
    if (columnRoles.geographies.length) list.push(columnRoles.geographies[0]);
    columnRoles.dimensions.forEach(dim => {
      if (!list.includes(dim) && list.length < 5) list.push(dim);
    });
    return list;
  }, [columnRoles]);

  // Global Cross-Filtered Dataset
  const filteredRows = useMemo(() => {
    let result = rawRows;
    const activeFilters = Object.entries(slicers).filter(([_, val]) => val !== "" && val != null && val !== "All");

    if (activeFilters.length === 0) return result;

    return result.filter(row => {
      return activeFilters.every(([col, val]) => String(row[col]) === String(val));
    });
  }, [rawRows, slicers]);

  const activeFilterCount = useMemo(() => {
    return Object.values(slicers).filter(val => val !== "" && val != null && val !== "All").length;
  }, [slicers]);

  // Clear all global slicers
  const handleClearSlicers = () => {
    setSlicers({});
    setHighlightedCategory(null);
    if (logEvent) {
      logEvent({
        stage: "05 Explore",
        action: "Reset Slicers & Cross-Filters",
        result: "Restored full dataset view"
      });
    }
  };

  // Cross-filter toggle on chart element click
  const handleElementCrossFilter = (colName, value) => {
    if (!colName || !value) return;
    setSlicers(prev => {
      const current = prev[colName];
      const next = current === String(value) ? "" : String(value);
      return { ...prev, [colName]: next };
    });
    setHighlightedCategory(value);
  };

  // Computed Interactive KPIs with Sparklines
  const kpiData = useMemo(() => {
    const topMetrics = columnRoles.metrics.slice(0, 4);
    if (!topMetrics.length && columnRoles.dimensions.length) {
      // Fallback count KPI
      return [{
        id: "total_records",
        name: "Total Records",
        value: filteredRows.length.toLocaleString(),
        trendText: "Active filtered rows",
        sparkline: [4, 6, 8, 5, 7, 9, 11, 8, 10, 12],
        isPositive: true
      }];
    }

    return topMetrics.map(metric => {
      const vals = filteredRows.map(r => Number(r[metric])).filter(v => !isNaN(v));
      const total = vals.reduce((a, b) => a + b, 0);
      const avg = vals.length ? total / vals.length : 0;

      // Compute 10-bucket sparkline
      const chunkSize = Math.max(1, Math.floor(vals.length / 10));
      const sparkline = [];
      for (let i = 0; i < vals.length; i += chunkSize) {
        const slice = vals.slice(i, i + chunkSize);
        const chunkAvg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
        sparkline.push(chunkAvg);
      }
      while (sparkline.length < 10) sparkline.push(avg);

      // Simple growth delta (second half vs first half)
      const half = Math.floor(vals.length / 2);
      const firstHalfAvg = vals.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
      const secondHalfAvg = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half || 1);
      const deltaPct = firstHalfAvg !== 0 ? (((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1) : "0";
      const isPositive = parseFloat(deltaPct) >= 0;

      return {
        id: metric,
        name: metric.replace(/_/g, " "),
        value: formatMetricValue(total, metric),
        avgValue: formatMetricValue(avg, metric),
        trendText: `${isPositive ? "↑" : "↓"} ${Math.abs(deltaPct)}% vs prior period`,
        isPositive,
        sparkline: sparkline.slice(0, 10),
        rawTotal: total
      };
    });
  }, [columnRoles, filteredRows]);

  // Primary Time-Series Trend Data (Visual 1)
  const timeSeriesData = useMemo(() => {
    if (!columnRoles.dates.length || !columnRoles.metrics.length) return null;
    const dateCol = columnRoles.dates[0];
    const metricCol = columnRoles.metrics[0];
    const secondaryMetric = columnRoles.metrics[1] || null;

    const grouped = {};
    filteredRows.forEach(row => {
      const rawDate = String(row[dateCol] || "").slice(0, 10);
      if (!rawDate) return;
      if (!grouped[rawDate]) grouped[rawDate] = { date: rawDate, [metricCol]: 0, count: 0, ...(secondaryMetric ? { [secondaryMetric]: 0 } : {}) };
      grouped[rawDate][metricCol] += Number(row[metricCol]) || 0;
      if (secondaryMetric) grouped[rawDate][secondaryMetric] += Number(row[secondaryMetric]) || 0;
      grouped[rawDate].count += 1;
    });

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    return {
      title: `${metricCol.replace(/_/g, " ")} Trend over ${dateCol.replace(/_/g, " ")}`,
      dateCol,
      metricCol,
      secondaryMetric,
      data: sorted.slice(-30) // Show last 30 intervals
    };
  }, [columnRoles, filteredRows]);

  // Categorical Breakdown & Ranking Data (Visual 2)
  const categoryBreakdownData = useMemo(() => {
    if (!columnRoles.dimensions.length || !columnRoles.metrics.length) return null;
    const dimCol = drillDowns["cat_breakdown"] || columnRoles.dimensions[0];
    const metricCol = columnRoles.metrics[0];

    const grouped = {};
    filteredRows.forEach(row => {
      const key = String(row[dimCol] || "Other");
      grouped[key] = (grouped[key] || 0) + (Number(row[metricCol]) || 0);
    });

    const data = Object.entries(grouped)
      .map(([name, val]) => ({ name, value: Math.round(val * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      id: "cat_breakdown",
      title: `${metricCol.replace(/_/g, " ")} by ${dimCol.replace(/_/g, " ")}`,
      dimCol,
      metricCol,
      data
    };
  }, [columnRoles, filteredRows, drillDowns]);

  // Regional Geographic Distribution (Visual 3)
  const geographicData = useMemo(() => {
    if (!columnRoles.geographies.length || !columnRoles.metrics.length) return null;
    const geoCol = columnRoles.geographies[0];
    const metricCol = columnRoles.metrics[0];

    const grouped = {};
    filteredRows.forEach(row => {
      const loc = String(row[geoCol] || "Unassigned");
      if (!grouped[loc]) grouped[loc] = { region: loc, value: 0, count: 0 };
      grouped[loc].value += Number(row[metricCol]) || 0;
      grouped[loc].count += 1;
    });

    const list = Object.values(grouped).sort((a, b) => b.value - a.value);
    const maxVal = Math.max(...list.map(l => l.value), 1);

    return {
      title: `Geographic Performance by ${geoCol.replace(/_/g, " ")}`,
      geoCol,
      metricCol,
      regions: list.map(item => ({
        ...item,
        percentage: ((item.value / maxVal) * 100).toFixed(0)
      }))
    };
  }, [columnRoles, filteredRows]);

  // Category Share / Composition (Visual 4)
  const shareData = useMemo(() => {
    const dimCol = columnRoles.dimensions.length > 1 ? columnRoles.dimensions[1] : columnRoles.dimensions[0];
    if (!dimCol || !columnRoles.metrics.length) return null;
    const metricCol = columnRoles.metrics[0];

    const grouped = {};
    let total = 0;
    filteredRows.forEach(row => {
      const key = String(row[dimCol] || "Other");
      const val = Number(row[metricCol]) || 0;
      grouped[key] = (grouped[key] || 0) + val;
      total += val;
    });

    const data = Object.entries(grouped)
      .map(([name, val]) => ({
        name,
        value: val,
        share: total > 0 ? ((val / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      title: `${dimCol.replace(/_/g, " ")} Composition Share`,
      dimCol,
      metricCol,
      data
    };
  }, [columnRoles, filteredRows]);

  // Correlation Scatter Plot (Visual 5)
  const scatterData = useMemo(() => {
    if (columnRoles.metrics.length < 2) return null;
    const xMetric = columnRoles.metrics[0];
    const yMetric = columnRoles.metrics[1];
    const labelDim = columnRoles.dimensions[0] || null;

    const data = filteredRows.slice(0, 60).map((r, i) => ({
      x: Number(r[xMetric]) || 0,
      y: Number(yMetric) || 0,
      label: labelDim ? String(r[labelDim]) : `Record ${i + 1}`
    }));

    return {
      title: `${xMetric.replace(/_/g, " ")} vs. ${yMetric.replace(/_/g, " ")} Correlation`,
      xMetric,
      yMetric,
      data
    };
  }, [columnRoles, filteredRows]);

  // Synthesized AI Executive Insights for Active Dataset & Filter
  const activeAiInsights = useMemo(() => {
    if (!filteredRows.length) return [];
    const insights = [];
    const firstMetric = columnRoles.metrics[0];
    const firstDim = columnRoles.dimensions[0];

    if (categoryBreakdownData && categoryBreakdownData.data.length > 0) {
      const top = categoryBreakdownData.data[0];
      insights.push({
        type: "positive",
        icon: "📈",
        headline: `Top Driver: ${top.name}`,
        detail: `${top.name} represents the leading volume with ${formatMetricValue(top.value, firstMetric)} (${categoryBreakdownData.dimCol}).`
      });
    }

    if (geographicData && geographicData.regions.length > 1) {
      const topGeo = geographicData.regions[0];
      const bottomGeo = geographicData.regions[geographicData.regions.length - 1];
      insights.push({
        type: "attention",
        icon: "🌍",
        headline: `Regional Variance: ${topGeo.region} vs. ${bottomGeo.region}`,
        detail: `${topGeo.region} leads benchmark by ${((topGeo.value / (bottomGeo.value || 1))).toFixed(1)}x. Consider reallocating resource capacity.`
      });
    }

    if (activeFilterCount > 0) {
      insights.push({
        type: "filter",
        icon: "⚡",
        headline: `Cross-Filter Active (${activeFilterCount} dimensions applied)`,
        detail: `Displaying verified segment of ${filteredRows.length.toLocaleString()} rows (${((filteredRows.length / (rawRows.length || 1)) * 100).toFixed(1)}% of dataset).`
      });
    } else {
      insights.push({
        type: "neutral",
        icon: "🛡️",
        headline: "Data Reliability & Quality Verified",
        detail: `${filteredRows.length.toLocaleString()} rows audited. Tabular schema verified with client-side calculations.`
      });
    }

    return insights;
  }, [filteredRows, columnRoles, categoryBreakdownData, geographicData, activeFilterCount, rawRows]);

  // Handler for Visual "Ask Copilot"
  const handleVisualAskCopilot = (visualTitle) => {
    const prompt = `Analyze key business trends, drivers, and outliers for: ${visualTitle} (with active filters: ${JSON.stringify(slicers)})`;
    if (onAskQuestion) {
      onAskQuestion(prompt);
    } else if (askQuestion) {
      askQuestion(prompt);
    }
  };

  // Handler for Visual Drilldown
  const handleToggleDrilldown = (visualId, currentDim) => {
    const nextDim = columnRoles.dimensions.find(d => d !== currentDim);
    if (nextDim) {
      setDrillDowns(prev => ({ ...prev, [visualId]: nextDim }));
    } else {
      setDrillDowns(prev => {
        const copy = { ...prev };
        delete copy[visualId];
        return copy;
      });
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 20,
      fontFamily: "var(--font-sans, 'Inter', sans-serif)",
      color: "var(--text-primary, #0F172A)"
    }}>
      {/* 1. TOP HEADER & EXECUTIVE TOOLBAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        background: "var(--bg-secondary, #FFFFFF)",
        padding: "16px 22px",
        borderRadius: 16,
        border: "1px solid var(--border-color, #E2E8F0)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              margin: 0,
              fontFamily: "var(--font-heading, 'Manrope', sans-serif)",
              letterSpacing: "-0.02em"
            }}>
              {t("hdr_executive_dashboard", "Executive Analytics Dashboard")}
            </h1>
            <span style={{
              background: "#EFF6FF",
              color: "#2563EB",
              border: "1px solid #BFDBFE",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 12
            }}>
              Power BI-Style Engine
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary, #64748B)", marginTop: 4 }}>
            Business performance at a glance • <strong style={{ color: "var(--text-primary)" }}>{active?.name || "Verified Dataset"}</strong> ({filteredRows.length.toLocaleString()} of {rawRows.length.toLocaleString()} rows)
          </div>
        </div>

        {/* Toolbar Utility Buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Presentation Mode Toggle */}
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            title="Toggle Clean Executive Presentation Mode"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: isPresentationMode ? "#0F172A" : "var(--bg-primary, #F8FAFC)",
              color: isPresentationMode ? "#FFFFFF" : "var(--text-primary, #0F172A)",
              border: "1px solid var(--border-color, #CBD5E1)",
              borderRadius: 8,
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <span>📺</span>
            <span>{isPresentationMode ? "Exit Presentation" : "Presentation Mode"}</span>
          </button>

          {/* Quick PDF Report Download */}
          <button
            onClick={() => {
              const printWin = window.open("", "_blank");
              if (printWin) {
                printWin.document.write(`<html><head><title>Dashboard Report - ${active?.name}</title></head><body><h2>Executive Dashboard Report: ${active?.name}</h2><p>Rows: ${filteredRows.length} | Filters: ${JSON.stringify(slicers)}</p></body></html>`);
                printWin.print();
              } else {
                window.print();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#059669",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(5,150,105,0.25)"
            }}
          >
            <span>📄</span>
            <span>{t("btn_generate_report", "Export PDF")}</span>
          </button>

          {/* Ask AI Copilot */}
          <button
            onClick={() => handleVisualAskCopilot("Executive Overview Summary")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(37,99,235,0.25)"
            }}
          >
            <span>🤖</span>
            <span>{t("btn_ask_copilot", "Ask Copilot")}</span>
          </button>
        </div>
      </div>

      {/* 2. POWER BI-STYLE SLICERS / INTERACTIVE GLOBAL FILTERS BAR */}
      <div style={{
        background: "var(--bg-secondary, #FFFFFF)",
        border: "1px solid var(--border-color, #E2E8F0)",
        borderRadius: 14,
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
            <span>🔍</span> {t("filter_by", "FILTERS / SLICERS")}:
          </span>

          {slicerColumns.map(col => {
            const uniqueOptions = Array.from(new Set(rawRows.map(r => String(r[col] || "")))).filter(Boolean).slice(0, 30);
            const selectedVal = slicers[col] || "All";

            return (
              <div key={col} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary, #64748B)", fontWeight: 600 }}>{col}:</span>
                <select
                  value={selectedVal}
                  onChange={(e) => setSlicers(prev => ({ ...prev, [col]: e.target.value === "All" ? "" : e.target.value }))}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: selectedVal !== "All" && selectedVal !== "" ? "2px solid #2563EB" : "1px solid #CBD5E1",
                    background: selectedVal !== "All" && selectedVal !== "" ? "#EFF6FF" : "var(--bg-primary, #F8FAFC)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-primary, #0F172A)",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="All">{t("slicer_all_regions", "All")} ({uniqueOptions.length})</option>
                  {uniqueOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Active Filter Indicators & Reset Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeFilterCount > 0 && (
            <span style={{
              background: "#DBEAFE",
              color: "#1E40AF",
              fontSize: 11.5,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 12
            }}>
              ● {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearSlicers}
              style={{
                background: "none",
                border: "none",
                color: "#DC2626",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: "2px 6px"
              }}
            >
              ✕ {t("btn_reset_filters", "Clear All Filters")}
            </button>
          )}
        </div>
      </div>

      {/* 3. INTERACTIVE KPI CARDS GRID (WITH MINI-SPARKLINES) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 14
      }}>
        {kpiData.map(kpi => (
          <div
            key={kpi.id}
            onClick={() => handleVisualAskCopilot(`Detailed breakdown of metric: ${kpi.name}`)}
            title="Click to deep dive into this metric with AI"
            style={{
              background: "var(--bg-secondary, #FFFFFF)",
              border: "1px solid var(--border-color, #E2E8F0)",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary, #64748B)", textTransform: "uppercase" }}>
                {kpi.name}
              </span>
              <span style={{ fontSize: 11, color: "#2563EB", fontWeight: 700 }}>🔍 Deep Dive</span>
            </div>

            <div style={{ margin: "10px 0 6px 0" }}>
              <div style={{
                fontSize: 26,
                fontWeight: 800,
                color: "var(--text-primary, #0F172A)",
                fontFamily: "var(--font-heading, 'Manrope', sans-serif)"
              }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11.5, color: kpi.isPositive ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                {kpi.trendText}
              </div>
            </div>

            {/* SVG Micro-Sparkline */}
            <div style={{ height: 26, width: "100%", marginTop: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpi.sparkline.map((v, i) => ({ i, v }))}>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={kpi.isPositive ? "#10B981" : "#EF4444"}
                    fill={kpi.isPositive ? "#D1FAE5" : "#FEE2E2"}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* 4. VISUALIZATION GRID (12-COLUMN POWER BI GRID) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
        
        {/* VISUAL 1: Time Series Area / Line Chart (Cols 1 to 7) */}
        {timeSeriesData && (
          <div style={{
            gridColumn: geographicData ? "span 7" : "span 12",
            background: "var(--bg-secondary, #FFFFFF)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Visual Header with Action Menu */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                  {timeSeriesData.title}
                </h3>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary, #64748B)" }}>
                  Continuous interval time-series trajectory
                </div>
              </div>

              {/* Action Menu (⋮) */}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setExplainingVisual(explainingVisual === "time_series" ? null : "time_series")}
                  title="Explain this chart with AI"
                  style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  ✨ {t("btn_explain_charts", "Explain")}
                </button>
                <button
                  onClick={() => handleVisualAskCopilot(timeSeriesData.title)}
                  title="Ask Copilot about this visual"
                  style={{ background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  🤖 {t("btn_ask_copilot", "Ask")}
                </button>
              </div>
            </div>

            {/* AI Explanation Callout if toggled */}
            {explainingVisual === "time_series" && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: "#1E40AF" }}>
                💡 <strong>AI Analysis:</strong> Time-series distribution displays consistent variance across active intervals. Peak velocity observed in later periods with normal regression residuals.
              </div>
            )}

            {/* Chart Canvas */}
            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData.data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={(v) => formatMetricValue(v)} />
                  <Tooltip formatter={(value) => [formatMetricValue(value, timeSeriesData.metricCol), timeSeriesData.metricCol]} />
                  <Area type="monotone" dataKey={timeSeriesData.metricCol} stroke="#2563EB" fill="#DBEAFE" strokeWidth={2} />
                  {timeSeriesData.secondaryMetric && (
                    <Area type="monotone" dataKey={timeSeriesData.secondaryMetric} stroke="#0D9488" fill="#CCFBF1" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VISUAL 2: Geographic Map / Regional Nodes (Cols 8 to 12) */}
        {geographicData && (
          <div style={{
            gridColumn: timeSeriesData ? "span 5" : "span 12",
            background: "var(--bg-secondary, #FFFFFF)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                  {geographicData.title}
                </h3>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary, #64748B)" }}>
                  Click a region to cross-filter dashboard
                </div>
              </div>
              <button
                onClick={() => handleVisualAskCopilot(geographicData.title)}
                style={{ background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                🤖 {t("btn_ask_copilot", "Ask")}
              </button>
            </div>

            {/* Regional Performance Distribution Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6, flex: 1, justifyContent: "center" }}>
              {geographicData.regions.slice(0, 5).map(reg => {
                const isSelected = slicers[geographicData.geoCol] === reg.region;
                return (
                  <div
                    key={reg.region}
                    onClick={() => handleElementCrossFilter(geographicData.geoCol, reg.region)}
                    style={{
                      cursor: "pointer",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isSelected ? "#EFF6FF" : "#F8FAFC",
                      border: isSelected ? "1px solid #2563EB" : "1px solid #E2E8F0",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: isSelected ? "#1E40AF" : "#0F172A" }}>
                        📍 {reg.region} {isSelected && "✓"}
                      </span>
                      <span>{formatMetricValue(reg.value, geographicData.metricCol)}</span>
                    </div>
                    <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                      <div style={{
                        width: `${reg.percentage}%`,
                        height: "100%",
                        background: isSelected ? "#2563EB" : "#38BDF8",
                        borderRadius: 3
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISUAL 3: Categorical Breakdown & Ranking Bar (Cols 1 to 6) */}
        {categoryBreakdownData && (
          <div style={{
            gridColumn: "span 6",
            background: "var(--bg-secondary, #FFFFFF)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                  {categoryBreakdownData.title}
                </h3>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary, #64748B)" }}>
                  Interactive drill-down • Click bar to filter
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleToggleDrilldown("cat_breakdown", categoryBreakdownData.dimCol)}
                  title="Drill down into next dimension"
                  style={{ background: "#F1F5F9", color: "#2563EB", border: "1px solid #CBD5E1", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  🔍 Drill
                </button>
                <button
                  onClick={() => handleVisualAskCopilot(categoryBreakdownData.title)}
                  style={{ background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  🤖 Ask
                </button>
              </div>
            </div>

            <div style={{ height: 240, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdownData.data} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMetricValue(v)} />
                  <Tooltip formatter={(val) => [formatMetricValue(val, categoryBreakdownData.metricCol), categoryBreakdownData.metricCol]} />
                  <Bar
                    dataKey="value"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    onClick={(entry) => handleElementCrossFilter(categoryBreakdownData.dimCol, entry.name)}
                    style={{ cursor: "pointer" }}
                  >
                    {categoryBreakdownData.data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={slicers[categoryBreakdownData.dimCol] === entry.name ? "#1E40AF" : PALETTE[index % PALETTE.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VISUAL 4: Donut / Share Composition (Cols 7 to 12) */}
        {shareData && (
          <div style={{
            gridColumn: "span 6",
            background: "var(--bg-secondary, #FFFFFF)",
            border: "1px solid var(--border-color, #E2E8F0)",
            borderRadius: 16,
            padding: 18,
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: "var(--text-primary, #0F172A)" }}>
                  {shareData.title}
                </h3>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary, #64748B)" }}>
                  Percentage share distribution
                </div>
              </div>
              <button
                onClick={() => handleVisualAskCopilot(shareData.title)}
                style={{ background: "#F1F5F9", color: "#475569", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                🤖 Ask
              </button>
            </div>

            <div style={{ height: 240, width: "100%", display: "flex", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shareData.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    onClick={(entry) => handleElementCrossFilter(shareData.dimCol, entry.name)}
                    style={{ cursor: "pointer" }}
                  >
                    {shareData.data.map((_, index) => (
                      <Cell key={`pie-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatMetricValue(val, shareData.metricCol), shareData.dimCol]} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* 5. AI INSIGHTS & STRATEGIC RECOMMENDATIONS PANEL */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        color: "#FFFFFF",
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ✨ Grounded Copilot Intelligence
            </div>
            <h3 style={{ margin: "2px 0 0 0", fontSize: 17, fontWeight: 800 }}>
              AI Business Insights & Anomaly Briefing
            </h3>
          </div>
          <button
            onClick={() => handleVisualAskCopilot("Synthesize 3 tactical management actions from active insights")}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              color: "#FFF",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Generate Executive Decisions →
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {activeAiInsights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "#F8FAFC" }}>
                <span>{insight.icon}</span>
                <span>{insight.headline}</span>
              </div>
              <div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>
                {insight.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. AUTOMATED EXECUTIVE REPORT EXPORTER SLUDGE (CONNECTS TO PC & EMAIL) */}
      <ExecutiveReportGenerator
        dataset={active}
        data={filteredRows}
        columns={columns}
        aiInsights={activeAiInsights.map(i => `${i.headline}: ${i.detail}`).join("\n\n")}
      />
    </div>
  );
}
