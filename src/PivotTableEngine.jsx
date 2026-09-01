import React, { useState, useMemo } from "react";

export function generatePivotMatrix(data = [], rowField = "", colField = "", metricField = "", aggFunc = "SUM") {
  if (!data || data.length === 0 || !rowField || !colField) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const rowValuesSet = new Set();
  const colValuesSet = new Set();
  const cellMap = {};

  evalRows.forEach(r => {
    const rVal = r[rowField] !== undefined && r[rowField] !== null && String(r[rowField]).trim() !== "" ? String(r[rowField]) : "(blank)";
    const cVal = r[colField] !== undefined && r[colField] !== null && String(r[colField]).trim() !== "" ? String(r[colField]) : "(blank)";
    const mVal = metricField ? Number(r[metricField]) : 1;

    rowValuesSet.add(rVal);
    colValuesSet.add(cVal);

    const key = `${rVal}::${cVal}`;
    if (!cellMap[key]) {
      cellMap[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    }

    cellMap[key].count += 1;
    if (!isNaN(mVal)) {
      cellMap[key].sum += mVal;
      cellMap[key].min = Math.min(cellMap[key].min, mVal);
      cellMap[key].max = Math.max(cellMap[key].max, mVal);
    }
  });

  const rowHeaders = Array.from(rowValuesSet).slice(0, 30);
  const colHeaders = Array.from(colValuesSet).slice(0, 20);

  const matrix = {};
  const rowTotals = {};
  const colTotals = {};
  let grandTotal = 0;
  let maxCellValue = 0;

  colHeaders.forEach(c => { colTotals[c] = 0; });

  rowHeaders.forEach(r => {
    matrix[r] = {};
    rowTotals[r] = 0;

    colHeaders.forEach(c => {
      const stats = cellMap[`${r}::${c}`];
      let val = 0;
      if (stats) {
        if (aggFunc === "SUM") val = stats.sum;
        else if (aggFunc === "AVG") val = stats.count ? stats.sum / stats.count : 0;
        else if (aggFunc === "COUNT") val = stats.count;
        else if (aggFunc === "MIN") val = stats.min === Infinity ? 0 : stats.min;
        else if (aggFunc === "MAX") val = stats.max === -Infinity ? 0 : stats.max;
      }

      val = +val.toFixed(2);
      matrix[r][c] = val;
      rowTotals[r] += val;
      colTotals[c] += val;
      grandTotal += val;
      if (val > maxCellValue) maxCellValue = val;
    });
  });

  return { rowHeaders, colHeaders, matrix, rowTotals, colTotals, grandTotal: +grandTotal.toFixed(2), maxCellValue };
}

export default function PivotTableEngine({ data = [], columns = [] }) {
  const categoricalCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "string" || isNaN(Number(r[col]))));
  }, [columns, data]);

  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const [rowField, setRowField] = useState("");
  const [colField, setColField] = useState("");
  const [metricField, setMetricField] = useState("");
  const [aggFunc, setAggFunc] = useState("SUM");

  const activeRow = rowField || categoricalCols[0] || columns[0] || "";
  const activeCol = colField || categoricalCols[1] || columns[1] || "";
  const activeMetric = metricField || numericCols[0] || "";

  const pivot = useMemo(() => {
    if (!data || data.length === 0 || !activeRow || !activeCol) return null;
    return generatePivotMatrix(data, activeRow, activeCol, activeMetric, aggFunc);
  }, [data, activeRow, activeCol, activeMetric, aggFunc]);

  const handleExportCsv = () => {
    if (!pivot) return;

    const headers = [activeRow, ...pivot.colHeaders, "Row Total"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    pivot.rowHeaders.forEach(r => {
      const rowVals = pivot.colHeaders.map(c => pivot.matrix[r][c]);
      csvRows.push([`"${r}"`, ...rowVals, pivot.rowTotals[r]].join(","));
    });

    const colTotalsRow = ["Column Total", ...pivot.colHeaders.map(c => pivot.colTotals[c]), pivot.grandTotal];
    csvRows.push(colTotalsRow.map(v => `"${v}"`).join(","));

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pivot_table_${activeRow}_vs_${activeCol}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
            🔍 Interactive AI Pivot Table & Cross-Tabulation Engine
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Dynamically cross-tabulate row dimensions against column dimensions with custom metric aggregations and grand totals.
          </p>
        </div>

        {pivot && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Pivot Table (CSV)
          </button>
        )}
      </div>

      {/* Configurator Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Row Dimension:</label>
          <select
            value={activeRow}
            onChange={e => setRowField(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Column Dimension:</label>
          <select
            value={activeCol}
            onChange={e => setColField(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. Target Metric:</label>
          <select
            value={activeMetric}
            onChange={e => setMetricField(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>4. Aggregation Method:</label>
          <select
            value={aggFunc}
            onChange={e => setAggFunc(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            <option value="SUM">SUM (Total)</option>
            <option value="AVG">AVG (Average)</option>
            <option value="COUNT">COUNT (Frequency)</option>
            <option value="MIN">MIN (Minimum)</option>
            <option value="MAX">MAX (Maximum)</option>
          </select>
        </div>
      </div>

      {/* 2D Pivot Matrix Grid */}
      {pivot && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "right" }}>
            <thead>
              <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151" }}>
                  {activeRow} \ {activeCol}
                </th>
                {pivot.colHeaders.map(c => (
                  <th key={c} style={{ padding: "10px 12px", fontWeight: 700, color: "#374151" }}>{c}</th>
                ))}
                <th style={{ padding: "10px 12px", fontWeight: 800, color: "#1F2937", background: "#E5E7EB" }}>Row Total</th>
              </tr>
            </thead>
            <tbody>
              {pivot.rowHeaders.map(r => (
                <tr key={r} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#1F2937", background: "#FAFAFA" }}>{r}</td>
                  {pivot.colHeaders.map(c => {
                    const val = pivot.matrix[r][c];
                    const opacity = pivot.maxCellValue > 0 ? (val / pivot.maxCellValue) * 0.4 : 0;
                    return (
                      <td
                        key={c}
                        style={{
                          padding: "10px 12px",
                          backgroundColor: val > 0 ? `rgba(62, 111, 142, ${Math.max(0.04, opacity)})` : "transparent",
                          fontWeight: val > 0 ? 600 : 400
                        }}
                      >
                        {val.toLocaleString()}
                      </td>
                    );
                  })}
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#3E6F8E", background: "#F3F4F6" }}>
                    {pivot.rowTotals[r].toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Column Totals & Grand Total Row */}
              <tr style={{ background: "#E5E7EB", fontWeight: 800, borderTop: "2px solid #D1D5DB" }}>
                <td style={{ padding: "10px 12px", textAlign: "left", color: "#1F2937" }}>Column Total</td>
                {pivot.colHeaders.map(c => (
                  <td key={c} style={{ padding: "10px 12px", color: "#1F2937" }}>
                    {pivot.colTotals[c].toLocaleString()}
                  </td>
                ))}
                <td style={{ padding: "10px 12px", color: "#059669", fontSize: 13.5 }}>
                  {pivot.grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
