import React, { useMemo, useEffect } from "react";
import { useDataset } from "./context/DatasetContext";

export default function GlobalFilterBar({ data: propData = [], columns: propCols = [], onFilterChange }) {
  const datasetCtx = useDataset();

  // Prefer context if available, otherwise fallback to props
  const datasetFilters = datasetCtx?.filters;
  const updateFilter = datasetCtx?.updateFilter;
  const resetFilters = datasetCtx?.resetFilters;
  const ctxFilteredRows = datasetCtx?.filteredRows;
  const ctxUnfilteredRows = datasetCtx?.unfilteredRows;

  const data = (ctxUnfilteredRows && ctxUnfilteredRows.length > 0) ? ctxUnfilteredRows : propData;
  const columns = (datasetCtx?.activeCols && datasetCtx.activeCols.length > 0) ? datasetCtx.activeCols : propCols;

  // Local fallback state if used outside DatasetProvider
  const [localFilters, setLocalFilters] = React.useState({
    searchTerm: "",
    categoryCol: "",
    categoryVal: "all",
    metricCol: "",
    minVal: "",
    maxVal: "",
    dateCol: "",
    startDate: "",
    endDate: ""
  });

  const filters = datasetFilters || localFilters;
  const handleUpdate = (patch) => {
    if (updateFilter) {
      updateFilter(patch);
    } else {
      setLocalFilters(prev => ({ ...prev, ...patch }));
    }
  };
  const handleReset = () => {
    if (resetFilters) {
      resetFilters();
    } else {
      setLocalFilters({
        searchTerm: "",
        categoryCol: "",
        categoryVal: "all",
        metricCol: "",
        minVal: "",
        maxVal: "",
        dateCol: "",
        startDate: "",
        endDate: ""
      });
    }
  };

  // Detect column types: dates, metrics, and categories
  const { dateCols, catCols, numCols, uniqueCatVals, dateBounds } = useMemo(() => {
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return { dateCols: [], catCols: [], numCols: [], uniqueCatVals: [], dateBounds: { min: "", max: "" } };
    }

    const evalRows = data.length > 3000 ? data.slice(0, 3000) : data;
    const num = [];
    const cat = [];
    const date = [];

    const dateRegex = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/;

    columns.forEach(col => {
      const lower = col.toLowerCase();
      const isDateName = /date|time|period|month|year|timestamp|day|dob|^dt$/i.test(lower);
      const isCodeOrId = /code|id|uuid|guid|sku|ref|token|hash|number|^aud/i.test(lower);

      const nonEmpties = evalRows.map(r => r[col]).filter(v => v !== null && v !== undefined && String(v).trim() !== "");
      const sample = nonEmpties.slice(0, 50);

      const isSampleDate = sample.length > 0 && sample.filter(v => {
        if (v instanceof Date && !isNaN(v.getTime())) return true;
        const s = String(v).trim();
        return dateRegex.test(s) || (!isNaN(Date.parse(s)) && isNaN(Number(s)));
      }).length / sample.length > 0.6;

      if ((isDateName || isSampleDate) && !isCodeOrId) {
        date.push(col);
      } else {
        const isNum = sample.length > 0 && sample.filter(v => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length / sample.length > 0.8;
        if (isNum && !isCodeOrId) {
          num.push(col);
        } else {
          cat.push(col);
        }
      }
    });

    // Unique category values for currently selected category
    const selectedCat = filters.categoryCol || cat[0] || "";
    let vals = [];
    if (selectedCat) {
      const rawVals = new Set(evalRows.map(r => String(r[selectedCat] ?? "")).filter(Boolean));
      vals = Array.from(rawVals).slice(0, 50);
    }

    // Min / Max bounds for primary date column
    const selectedDateCol = filters.dateCol || date[0] || "";
    let minDate = "";
    let maxDate = "";
    if (selectedDateCol) {
      const parsedTimes = evalRows
        .map(r => new Date(r[selectedDateCol]).getTime())
        .filter(t => !isNaN(t));
      if (parsedTimes.length > 0) {
        minDate = new Date(Math.min(...parsedTimes)).toISOString().slice(0, 10);
        maxDate = new Date(Math.max(...parsedTimes)).toISOString().slice(0, 10);
      }
    }

    return {
      dateCols: date,
      catCols: cat,
      numCols: num,
      uniqueCatVals: vals,
      dateBounds: { min: minDate, max: maxDate }
    };
  }, [data, columns, filters.categoryCol, filters.dateCol]);

  // Derive filtered rows if not in context
  const derivedFilteredRows = useMemo(() => {
    if (ctxFilteredRows) return ctxFilteredRows;
    if (!data || data.length === 0) return [];

    return data.filter(row => {
      if (filters.searchTerm?.trim()) {
        const q = filters.searchTerm.trim().toLowerCase();
        const matches = Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.categoryCol && filters.categoryVal !== "all") {
        if (String(row[filters.categoryCol] ?? "") !== filters.categoryVal) return false;
      }
      if (filters.metricCol) {
        const n = Number(row[filters.metricCol]);
        if (isNaN(n)) return false;
        if (filters.minVal !== "" && n < Number(filters.minVal)) return false;
        if (filters.maxVal !== "" && n > Number(filters.maxVal)) return false;
      }
      if (filters.dateCol) {
        const t = new Date(row[filters.dateCol]).getTime();
        if (!isNaN(t)) {
          if (filters.startDate && t < new Date(filters.startDate).getTime()) return false;
          if (filters.endDate && t > new Date(filters.endDate).getTime()) return false;
        }
      }
      return true;
    });
  }, [ctxFilteredRows, data, filters]);

  // Inform parent callback if passed
  useEffect(() => {
    if (typeof onFilterChange === "function") {
      onFilterChange(derivedFilteredRows);
    }
  }, [derivedFilteredRows, onFilterChange]);

  // Count active filters
  const activeFilterCount = [
    Boolean(filters.searchTerm?.trim()),
    Boolean(filters.categoryCol && filters.categoryVal !== "all"),
    Boolean(filters.metricCol && (filters.minVal !== "" || filters.maxVal !== "")),
    Boolean(filters.dateCol && (filters.startDate !== "" || filters.endDate !== ""))
  ].reduce((a, b) => a + (b ? 1 : 0), 0);

  if (!data || data.length === 0) return null;

  return (
    <div
      data-testid="global-filter-bar"
      style={{
        position: "relative",
        zIndex: 10,
        background: "#F8FAFC",
        border: "1px solid #CBD5E1",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        fontFamily: "var(--font-sans, sans-serif)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚡ Universal Filter Control Bar</span>
          {activeFilterCount > 0 && (
            <span style={{ backgroundColor: "#2563EB", color: "#FFF", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 12 }}>
              {activeFilterCount} Active
            </span>
          )}
          <span data-testid="filter-visible-count" style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
            ({derivedFilteredRows.length.toLocaleString()} / {data.length.toLocaleString()} rows visible)
          </span>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            style={{
              backgroundColor: "#EFF6FF",
              color: "#1E40AF",
              border: "1px solid #BFDBFE",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            <span>🔄 Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter Controls Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, alignItems: "center" }}>
        {/* Global Substring Search */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
            Global Search:
          </label>
          <input
            type="text"
            placeholder="Search dataset (e.g. CA-2024-1005)…"
            value={filters.searchTerm || ""}
            onChange={e => handleUpdate({ searchTerm: e.target.value })}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12, boxSizing: "border-box", background: "#FFFFFF" }}
          />
        </div>

        {/* Date Range Picker */}
        {dateCols.length > 0 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
              Date Range ({dateCols[0]}):
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="date"
                title="Start Date"
                min={dateBounds.min}
                max={dateBounds.max}
                value={filters.startDate || ""}
                onChange={e => handleUpdate({ dateCol: filters.dateCol || dateCols[0], startDate: e.target.value })}
                style={{ width: "50%", padding: "5px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11, background: "#FFFFFF", boxSizing: "border-box" }}
              />
              <input
                type="date"
                title="End Date"
                min={dateBounds.min}
                max={dateBounds.max}
                value={filters.endDate || ""}
                onChange={e => handleUpdate({ dateCol: filters.dateCol || dateCols[0], endDate: e.target.value })}
                style={{ width: "50%", padding: "5px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11, background: "#FFFFFF", boxSizing: "border-box" }}
              />
            </div>
          </div>
        )}

        {/* Category Slicer */}
        {catCols.length > 0 && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
              Category Filter:
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <select
                value={filters.categoryCol || catCols[0]}
                onChange={e => handleUpdate({ categoryCol: e.target.value, categoryVal: "all" })}
                style={{ width: "50%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, background: "#FFFFFF" }}
              >
                {catCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filters.categoryVal || "all"}
                onChange={e => handleUpdate({ categoryCol: filters.categoryCol || catCols[0], categoryVal: e.target.value })}
                style={{ width: "50%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, background: "#FFFFFF" }}
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
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 3 }}>
              Metric Range (Min - Max):
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <select
                value={filters.metricCol || numCols[0]}
                onChange={e => handleUpdate({ metricCol: e.target.value })}
                style={{ width: "40%", padding: "6px 4px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11, background: "#FFFFFF" }}
              >
                {numCols.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                placeholder="Min"
                value={filters.minVal ?? ""}
                onChange={e => handleUpdate({ metricCol: filters.metricCol || numCols[0], minVal: e.target.value })}
                style={{ width: "30%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, boxSizing: "border-box", background: "#FFFFFF" }}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxVal ?? ""}
                onChange={e => handleUpdate({ metricCol: filters.metricCol || numCols[0], maxVal: e.target.value })}
                style={{ width: "30%", padding: "6px 6px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 11.5, boxSizing: "border-box", background: "#FFFFFF" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
