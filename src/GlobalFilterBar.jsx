import React, { useState, useEffect, useMemo } from "react";

export default function GlobalFilterBar({ data = [], columns = [], onFilterChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryCol, setCategoryCol] = useState("");
  const [categoryVal, setCategoryVal] = useState("all");
  const [metricCol, setMetricCol] = useState("");
  const [minVal, setMinVal] = useState("");
  const [maxVal, setMaxVal] = useState("");

  // Detect column types
  const { catCols, numCols, uniqueCatVals } = useMemo(() => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return { catCols: [], numCols: [], uniqueCatVals: [] };
    }

    const evalRows = data.length > 3000 ? data.slice(0, 3000) : data;
    const num = [];
    const cat = [];

    columns.forEach(col => {
      const isNum = evalRows.some(r => typeof r[col] === "number" || (!isNaN(Number(r[col])) && r[col] !== "" && r[col] !== null));
      if (isNum) num.push(col);
      else cat.push(col);
    });

    const selectedCat = categoryCol || cat[0] || "";
    let vals = [];
    if (selectedCat) {
      const rawVals = new Set(evalRows.map(r => String(r[selectedCat] ?? "")).filter(Boolean));
      vals = Array.from(rawVals).slice(0, 50);
    }

    return { catCols: cat, numCols: num, uniqueCatVals: vals };
  }, [data, columns, categoryCol]);

  // Apply filtering logic
  const filteredRows = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter(row => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesText = columns.some(col => String(row[col] ?? "").toLowerCase().includes(query));
        if (!matchesText) return false;
      }

      // 2. Category Filter
      if (categoryCol && categoryVal !== "all") {
        if (String(row[categoryCol] ?? "") !== categoryVal) return false;
      }

      // 3. Metric Range Filter
      if (metricCol) {
        const num = Number(row[metricCol]);
        if (!isNaN(num)) {
          if (minVal !== "" && num < Number(minVal)) return false;
          if (maxVal !== "" && num > Number(maxVal)) return false;
        }
      }

      return true;
    });
  }, [data, columns, searchTerm, categoryCol, categoryVal, metricCol, minVal, maxVal]);

  // Trigger callback when filtered rows change
  useEffect(() => {
    if (typeof onFilterChange === "function") {
      onFilterChange(filteredRows);
    }
  }, [filteredRows, onFilterChange]);

  // Count active filters
  const activeFilterCount = [
    searchTerm.trim() ? 1 : 0,
    categoryCol && categoryVal !== "all" ? 1 : 0,
    metricCol && (minVal !== "" || maxVal !== "") ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const handleReset = () => {
    setSearchTerm("");
    setCategoryVal("all");
    setMinVal("");
    setMaxVal("");
  };

  if (!data || data.length === 0) return null;

  return (
    <div style={{ position: "sticky", top: 10, zIndex: 100, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
          ⚡ Global Filter Control Bar
          {activeFilterCount > 0 && (
            <span style={{ backgroundColor: "#3B82F6", color: "#FFF", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 12 }}>
              {activeFilterCount} Active
            </span>
          )}
          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            ({filteredRows.length.toLocaleString()} / {data.length.toLocaleString()} rows visible)
          </span>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
          >
            🔄 Reset Filters
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "center" }}>
        {/* Substring Search */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Global Search:</label>
          <input
            type="text"
            placeholder="Search dataset…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box" }}
          />
        </div>

        {/* Category Slicer */}
        {catCols.length > 0 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Category Filter:</label>
            <div style={{ display: "flex", gap: 4 }}>
              <select
                value={categoryCol || catCols[0]}
                onChange={e => { setCategoryCol(e.target.value); setCategoryVal("all"); }}
                style={{ width: "50%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, background: "#FFF" }}
              >
                {catCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={categoryVal}
                onChange={e => setCategoryVal(e.target.value)}
                style={{ width: "50%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, background: "#FFF" }}
              >
                <option value="all">All Values</option>
                {uniqueCatVals.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Metric Slicer */}
        {numCols.length > 0 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>Metric Range (Min - Max):</label>
            <div style={{ display: "flex", gap: 4 }}>
              <select
                value={metricCol || numCols[0]}
                onChange={e => setMetricCol(e.target.value)}
                style={{ width: "40%", padding: "6px 4px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11, background: "#FFF" }}
              >
                {numCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Min"
                value={minVal}
                onChange={e => setMinVal(e.target.value)}
                style={{ width: "30%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, boxSizing: "border-box" }}
              />
              <input
                type="number"
                placeholder="Max"
                value={maxVal}
                onChange={e => setMaxVal(e.target.value)}
                style={{ width: "30%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, boxSizing: "border-box" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
