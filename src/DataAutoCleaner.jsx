import React, { useState, useMemo } from "react";

export function autoCleanDataset(data = [], columns = [], options = { imputeMethod: "mean", removeDuplicates: true, trimWhitespace: true }) {
  if (!data || data.length === 0) return { cleanedRows: [], stats: { imputedCount: 0, duplicatesRemoved: 0, stringsTrimmed: 0 } };

  const numericCols = columns.filter(c => data.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));

  // Calculate Mean and Median for numeric columns
  const colMeans = {};
  const colMedians = {};

  numericCols.forEach(col => {
    const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (vals.length > 0) {
      const sum = vals.reduce((a, b) => a + b, 0);
      colMeans[col] = +(sum / vals.length).toFixed(2);

      const sorted = [...vals].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      colMedians[col] = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
    }
  });

  let imputedCount = 0;
  let stringsTrimmed = 0;

  // Process rows
  const processedRows = data.map(row => {
    const newRow = { ...row };

    columns.forEach(col => {
      let val = newRow[col];

      // Trim whitespace
      if (options.trimWhitespace && typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed !== val) {
          val = trimmed;
          stringsTrimmed += 1;
        }
      }

      // Impute missing numeric values
      if (numericCols.includes(col)) {
        if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
          val = options.imputeMethod === "median" ? (colMedians[col] ?? 0) : (colMeans[col] ?? 0);
          imputedCount += 1;
        } else {
          val = Number(val);
        }
      }

      newRow[col] = val;
    });

    return newRow;
  });

  // Remove duplicates
  let cleanedRows = processedRows;
  let duplicatesRemoved = 0;

  if (options.removeDuplicates) {
    const seen = new Set();
    const uniqueRows = [];

    processedRows.forEach(r => {
      const key = JSON.stringify(r);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(r);
      } else {
        duplicatesRemoved += 1;
      }
    });

    cleanedRows = uniqueRows;
  }

  return {
    cleanedRows,
    stats: { imputedCount, duplicatesRemoved, stringsTrimmed }
  };
}

export default function DataAutoCleaner({ data = [], columns = [], onUpdateDataset }) {
  const [imputeMethod, setImputeMethod] = useState("mean");
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [lastAudit, setLastAudit] = useState(null);

  const handleClean = () => {
    const result = autoCleanDataset(data, columns, { imputeMethod, removeDuplicates, trimWhitespace });
    setLastAudit(result.stats);

    if (onUpdateDataset) {
      onUpdateDataset(result.cleanedRows, columns);
    }
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) return;

    const csvRows = [columns.map(c => `"${c}"`).join(",")];
    data.forEach(r => {
      csvRows.push(columns.map(c => `"${r[c] ?? ""}"`).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaned_dataset.csv";
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
            🧹 Data Auto-Cleaner & Missing Value Imputer
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            1-Click automated dataset cleaning: impute missing values, eliminate duplicate rows, and trim string whitespace.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          📥 Export Cleaned Dataset (CSV)
        </button>
      </div>

      {/* Cleaning Configurator Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Missing Value Imputation:</label>
          <select
            value={imputeMethod}
            onChange={e => setImputeMethod(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            <option value="mean">Mean (Column Average)</option>
            <option value="median">Median (Column 50th Percentile)</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={e => setRemoveDuplicates(e.target.checked)}
            />
            Remove Duplicate Rows
          </label>

          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={trimWhitespace}
              onChange={e => setTrimWhitespace(e.target.checked)}
            />
            Trim String Whitespace
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={handleClean}
            style={{ width: "100%", backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(62,111,142,0.3)" }}
          >
            🧹 Run 1-Click Auto-Cleaner
          </button>
        </div>
      </div>

      {/* Cleaning Audit Report Box */}
      {lastAudit && (
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#166534", marginBottom: 6 }}>
            ✅ Dataset Auto-Cleaning Completed Successfully!
          </div>
          <div style={{ fontSize: 13, color: "#15803D", lineHeight: 1.6 }}>
            • Imputed <strong>{lastAudit.imputedCount.toLocaleString()}</strong> missing numeric value{lastAudit.imputedCount !== 1 ? "s" : ""} using column {imputeMethod}.<br />
            • Removed <strong>{lastAudit.duplicatesRemoved.toLocaleString()}</strong> duplicate row{lastAudit.duplicatesRemoved !== 1 ? "s" : ""}.<br />
            • Trimmed <strong>{lastAudit.stringsTrimmed.toLocaleString()}</strong> string cell{lastAudit.stringsTrimmed !== 1 ? "s" : ""} with leading/trailing spaces.<br />
            • Workspace dataset state is updated and all BI dashboard charts have been refreshed.
          </div>
        </div>
      )}
    </div>
  );
}
