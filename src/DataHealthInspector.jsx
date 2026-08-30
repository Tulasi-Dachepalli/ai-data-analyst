import React, { useMemo, useState } from "react";

export default function DataHealthInspector({ dataset, data = [], columns = [], onUpdateDataset }) {
  const [cleanedData, setCleanedData] = useState(null);
  const [activeFix, setActiveFix] = useState(null);

  const currentData = cleanedData || data;

  const analysis = useMemo(() => {
    if (!currentData || currentData.length === 0 || !columns || columns.length === 0) {
      return null;
    }

    const totalRows = currentData.length;
    const totalCols = columns.length;
    let missingCellCount = 0;
    const columnStats = {};

    // 1. Column analysis
    columns.forEach(col => {
      let nulls = 0;
      const values = [];
      const typesSet = new Set();

      currentData.forEach(row => {
        const val = row[col];
        if (val === null || val === undefined || String(val).trim() === "") {
          nulls++;
          missingCellCount++;
        } else {
          values.push(val);
          typesSet.add(typeof val === "number" ? "number" : isNaN(Number(val)) ? "string" : "number");
        }
      });

      const uniqueCount = new Set(values).size;
      const isNumeric = values.length > 0 && values.every(v => typeof v === "number" || !isNaN(Number(v)));
      
      let outlierCount = 0;
      if (isNumeric && values.length > 3) {
        const numVals = values.map(v => Number(v));
        const mean = numVals.reduce((a, b) => a + b, 0) / numVals.length;
        const std = Math.sqrt(numVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numVals.length);
        if (std > 0) {
          outlierCount = numVals.filter(v => Math.abs(v - mean) > 3 * std).length;
        }
      }

      columnStats[col] = {
        nullCount: nulls,
        nullPct: Math.round((nulls / totalRows) * 100),
        uniqueCount,
        isNumeric,
        outlierCount
      };
    });

    // 2. Duplicate rows check
    const rowStrings = currentData.map(r => JSON.stringify(r));
    const duplicateRowCount = totalRows - new Set(rowStrings).size;

    // 3. Health score calculation
    const totalCells = totalRows * totalCols;
    const missingPct = (missingCellCount / totalCells) * 100;
    const dupPct = (duplicateRowCount / totalRows) * 100;

    let score = 100;
    score -= missingPct * 1.5;
    score -= dupPct * 2;
    if (score < 0) score = 0;
    score = Math.round(score);

    let grade = "A+";
    let statusColor = "#10B981";
    if (score < 60) { grade = "F"; statusColor = "#EF4444"; }
    else if (score < 75) { grade = "C"; statusColor = "#F59E0B"; }
    else if (score < 90) { grade = "B"; statusColor = "#3B82F6"; }

    return {
      totalRows,
      totalCols,
      missingCellCount,
      missingPct: missingPct.toFixed(1),
      duplicateRowCount,
      dupPct: dupPct.toFixed(1),
      columnStats,
      score,
      grade,
      statusColor
    };
  }, [currentData, columns]);

  if (!analysis) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#8A8580" }}>
        <h3>🩺 Data Health & Quality Inspector</h3>
        <p>Select or upload a dataset to run automated data quality & anomaly detection.</p>
      </div>
    );
  }

  // Quick Fix Actions
  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const filtered = currentData.filter(r => {
      const str = JSON.stringify(r);
      if (seen.has(str)) return false;
      seen.add(str);
      return true;
    });
    setCleanedData(filtered);
    setActiveFix("Removed duplicate rows!");
    if (onUpdateDataset) onUpdateDataset(filtered);
  };

  const handleFillMissing = () => {
    const filled = currentData.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        const val = newRow[col];
        if (val === null || val === undefined || String(val).trim() === "") {
          if (analysis.columnStats[col].isNumeric) {
            // Fill with column mean
            const validVals = currentData.map(r => Number(r[col])).filter(v => !isNaN(v));
            const mean = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
            newRow[col] = Math.round(mean * 100) / 100;
          } else {
            newRow[col] = "N/A";
          }
        }
      });
      return newRow;
    });
    setCleanedData(filled);
    setActiveFix("Filled missing values with averages/defaults!");
    if (onUpdateDataset) onUpdateDataset(filled);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
            🩺 AI Data Health & Quality Inspector
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>
            Automated anomaly detection, duplicate scanning, and dataset cleaning.
          </p>
        </div>

        {activeFix && (
          <div style={{ backgroundColor: "#D1FAE5", color: "#065F46", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
            ✅ {activeFix}
          </div>
        )}
      </div>

      {/* Top Metrics Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* Score Card */}
        <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 20, textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8580", textTransform: "uppercase", letterSpacing: "0.05em" }}>Data Health Score</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: analysis.statusColor, margin: "8px 0" }}>
            {analysis.score}<span style={{ fontSize: 20, color: "#9CA3AF" }}>/100</span>
          </div>
          <div style={{ inlineFlex: "true", padding: "3px 10px", borderRadius: 12, backgroundColor: `${analysis.statusColor}15`, color: analysis.statusColor, fontSize: 12, fontWeight: 700 }}>
            Grade {analysis.grade} Quality
          </div>
        </div>

        {/* Total Rows & Cols */}
        <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8580", textTransform: "uppercase" }}>Dataset Dimensions</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2B2A27", marginTop: 8 }}>
            {analysis.totalRows.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>rows</span>
          </div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            Across <strong>{analysis.totalCols}</strong> attributes/columns
          </div>
        </div>

        {/* Missing Values */}
        <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8580", textTransform: "uppercase" }}>Missing Cell Values</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: analysis.missingCellCount > 0 ? "#F59E0B" : "#10B981", marginTop: 8 }}>
            {analysis.missingCellCount} <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>({analysis.missingPct}%)</span>
          </div>
          <button
            onClick={handleFillMissing}
            disabled={analysis.missingCellCount === 0}
            style={{ marginTop: 8, fontSize: 12, padding: "4px 10px", backgroundColor: "#8B5CF6", color: "#FFF", border: "none", borderRadius: 6, cursor: analysis.missingCellCount === 0 ? "not-allowed" : "pointer", opacity: analysis.missingCellCount === 0 ? 0.5 : 1 }}
          >
            🧹 Auto-Fill Missing Values
          </button>
        </div>

        {/* Duplicates */}
        <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8A8580", textTransform: "uppercase" }}>Duplicate Rows</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: analysis.duplicateRowCount > 0 ? "#EF4444" : "#10B981", marginTop: 8 }}>
            {analysis.duplicateRowCount} <span style={{ fontSize: 14, fontWeight: 400, color: "#666" }}>({analysis.dupPct}%)</span>
          </div>
          <button
            onClick={handleRemoveDuplicates}
            disabled={analysis.duplicateRowCount === 0}
            style={{ marginTop: 8, fontSize: 12, padding: "4px 10px", backgroundColor: "#EF4444", color: "#FFF", border: "none", borderRadius: 6, cursor: analysis.duplicateRowCount === 0 ? "not-allowed" : "pointer", opacity: analysis.duplicateRowCount === 0 ? 0.5 : 1 }}
          >
            🗑️ Remove Duplicates
          </button>
        </div>
      </div>

      {/* Column Health Detail Table */}
      <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#2B2A27" }}>
          Attribute & Column Health Profiling
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #EAE7E0", textAlign: "left" }}>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Column Name</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Data Type</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Missing Count</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Unique Values</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Outliers (&gt;3σ)</th>
                <th style={{ padding: "10px 12px", fontWeight: 700, color: "#4B5563" }}>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {columns.map(col => {
                const stat = analysis.columnStats[col];
                const isHealthy = stat.nullCount === 0 && stat.outlierCount === 0;

                return (
                  <tr key={col} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1F2937" }}>{col}</td>
                    <td style={{ padding: "10px 12px", color: "#6B7280" }}>{stat.isNumeric ? "🔢 Numeric" : "🔤 Categorical"}</td>
                    <td style={{ padding: "10px 12px", color: stat.nullCount > 0 ? "#F59E0B" : "#10B981", fontWeight: stat.nullCount > 0 ? 700 : 400 }}>
                      {stat.nullCount} ({stat.nullPct}%)
                    </td>
                    <td style={{ padding: "10px 12px", color: "#4B5563" }}>{stat.uniqueCount}</td>
                    <td style={{ padding: "10px 12px", color: stat.outlierCount > 0 ? "#EF4444" : "#6B7280" }}>
                      {stat.outlierCount > 0 ? `⚠️ ${stat.outlierCount}` : "None"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, backgroundColor: isHealthy ? "#D1FAE5" : "#FEF3C7", color: isHealthy ? "#065F46" : "#D97706" }}>
                        {isHealthy ? "✅ Optimal" : "⚠️ Needs Clean"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
