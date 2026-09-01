import React, { useState, useMemo } from "react";

export default function DataFormulaStudio({ data = [], columns = [], onUpdateDataset }) {
  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const [colA, setColA] = useState("");
  const [operator, setOperator] = useState("-");
  const [colB, setColB] = useState("");
  const [newColName, setNewColName] = useState("Calculated_Metric");

  const [filterCol, setFilterCol] = useState("");
  const [filterOp, setFilterOp] = useState(">");
  const [filterVal, setFilterVal] = useState("");

  const [transformationLogs, setTransformationLogs] = useState([]);

  const activeColA = colA || numericCols[0] || columns[0] || "";
  const activeColB = colB || numericCols[1] || numericCols[0] || columns[0] || "";

  const handleApplyFormula = () => {
    if (!newColName.trim()) {
      alert("Please enter a valid name for the new calculated column.");
      return;
    }

    const updatedRows = data.map(row => {
      const valA = Number(row[activeColA]) || 0;
      const valB = Number(row[activeColB]) || 0;
      let res = 0;

      if (operator === "+") res = valA + valB;
      else if (operator === "-") res = valA - valB;
      else if (operator === "*") res = valA * valB;
      else if (operator === "/") res = valB !== 0 ? valA / valB : 0;
      else if (operator === "%") res = valB !== 0 ? (valA / valB) * 100 : 0;

      return {
        ...row,
        [newColName.trim()]: +res.toFixed(2)
      };
    });

    const updatedCols = Array.from(new Set([...columns, newColName.trim()]));

    if (onUpdateDataset) {
      onUpdateDataset(updatedRows, updatedCols);
    }

    setTransformationLogs(prev => [
      `✅ Created Calculated Column "${newColName.trim()}" = ${activeColA} ${operator} ${activeColB} across ${data.length.toLocaleString()} rows`,
      ...prev
    ]);

    setNewColName("");
  };

  const handleApplyFilter = () => {
    if (!filterCol || !filterVal) {
      alert("Please select a filter column and value.");
      return;
    }

    const filteredRows = data.filter(row => {
      const v = row[filterCol];
      const targetNum = Number(filterVal);
      const rowNum = Number(v);

      if (!isNaN(targetNum) && !isNaN(rowNum)) {
        if (filterOp === ">") return rowNum > targetNum;
        if (filterOp === "<") return rowNum < targetNum;
        if (filterOp === "=") return rowNum === targetNum;
        if (filterOp === "!=") return rowNum !== targetNum;
      }

      const strVal = String(v ?? "").toLowerCase();
      const targetStr = String(filterVal).toLowerCase();
      if (filterOp === "contains") return strVal.includes(targetStr);
      if (filterOp === "=") return strVal === targetStr;
      if (filterOp === "!=") return strVal !== targetStr;

      return true;
    });

    if (onUpdateDataset) {
      onUpdateDataset(filteredRows, columns);
    }

    setTransformationLogs(prev => [
      `🔍 Filtered Dataset: Retained ${filteredRows.length.toLocaleString()} / ${data.length.toLocaleString()} rows where "${filterCol} ${filterOp} ${filterVal}"`,
      ...prev
    ]);
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
    a.download = "transformed_dataset.csv";
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
            ⚡ Data Transformation & Formula Studio
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Engineer new calculated columns, apply row filters, and update workspace datasets in real time.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          📥 Export Transformed CSV
        </button>
      </div>

      {/* 1. Calculated Column Studio Box */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
          🧮 1. Engineer Calculated Column:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Column A:</label>
            <select
              value={activeColA}
              onChange={e => setColA(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Operator:</label>
            <select
              value={operator}
              onChange={e => setOperator(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              <option value="-">Subtraction (-)</option>
              <option value="+">Addition (+)</option>
              <option value="*">Multiplication (*)</option>
              <option value="/">Division (/)</option>
              <option value="%">Percentage (%)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Column B:</label>
            <select
              value={activeColB}
              onChange={e => setColB(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>New Column Name:</label>
            <input
              type="text"
              placeholder="e.g. Profit"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
            <button
              onClick={handleApplyFormula}
              style={{ width: "100%", backgroundColor: "#3E6F8E", color: "#FFF", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              ⚡ Add Calculated Column
            </button>
          </div>
        </div>
      </div>

      {/* 2. Row Filter Studio Box */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
          🔍 2. Filter Dataset Rows:
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, alignItems: "center" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Filter Column:</label>
            <select
              value={filterCol}
              onChange={e => setFilterCol(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              <option value="">Select column...</option>
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Condition:</label>
            <select
              value={filterOp}
              onChange={e => setFilterOp(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, backgroundColor: "#FFF" }}
            >
              <option value=">">Greater Than (&gt;)</option>
              <option value="<">Less Than (&lt;)</option>
              <option value="=">Equals (=)</option>
              <option value="!=">Not Equals (!=)</option>
              <option value="contains">Contains Text</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>Target Value:</label>
            <input
              type="text"
              placeholder="e.g. 500 or East"
              value={filterVal}
              onChange={e => setFilterVal(e.target.value)}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12.5, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
            <button
              onClick={handleApplyFilter}
              style={{ width: "100%", backgroundColor: "#3B82F6", color: "#FFF", border: "none", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              🔍 Apply Row Filter
            </button>
          </div>
        </div>
      </div>

      {/* Transformation History Log */}
      {transformationLogs.length > 0 && (
        <div style={{ backgroundColor: "#F3F4F6", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Recent Transformations Applied:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#4B5563" }}>
            {transformationLogs.map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
