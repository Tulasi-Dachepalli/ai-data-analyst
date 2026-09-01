import React, { useState, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function solveGoalSeek(data = [], targetCol = "", variableCol = "", targetGoalValue = 1000000) {
  if (!data || data.length === 0 || !targetCol || !variableCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const targetVals = evalRows.map(r => Number(r[targetCol])).filter(v => !isNaN(v));
  const variableVals = evalRows.map(r => Number(r[variableCol])).filter(v => !isNaN(v));

  if (targetVals.length === 0 || variableVals.length === 0) return null;

  const currentTargetSum = targetVals.reduce((a, b) => a + b, 0);
  const currentVariableSum = variableVals.reduce((a, b) => a + b, 0);

  if (currentTargetSum === 0 || currentVariableSum === 0) return null;

  const ratio = targetGoalValue / currentTargetSum;
  const requiredVariableSum = currentVariableSum * ratio;
  const pctAdjustment = +((ratio - 1) * 100).toFixed(1);

  const chartData = [
    { name: "Current Baseline", [targetCol]: +currentTargetSum.toFixed(2), [variableCol]: +currentVariableSum.toFixed(2) },
    { name: "Desired Target Goal", [targetCol]: +targetGoalValue.toFixed(2), [variableCol]: +requiredVariableSum.toFixed(2) }
  ];

  return {
    currentTargetSum: +currentTargetSum.toFixed(2),
    currentVariableSum: +currentVariableSum.toFixed(2),
    targetGoalValue: +targetGoalValue.toFixed(2),
    requiredVariableSum: +requiredVariableSum.toFixed(2),
    pctAdjustment,
    chartData
  };
}

export default function GoalSeekSolver({ data = [], columns = [] }) {
  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || (!isNaN(Number(r[c])) && r[c] !== "")));
  }, [columns, data]);

  const [targetCol, setTargetCol] = useState("");
  const [variableCol, setVariableCol] = useState("");
  const [targetGoalInput, setTargetGoalInput] = useState("1000000");

  const activeTarget = targetCol || numericCols[0] || "";
  const activeVariable = variableCol || numericCols[1] || numericCols[0] || "";

  const solution = useMemo(() => {
    const goalVal = Number(targetGoalInput) || 1000000;
    if (!data || data.length === 0 || !activeTarget || !activeVariable) return null;
    return solveGoalSeek(data, activeTarget, activeVariable, goalVal);
  }, [data, activeTarget, activeVariable, targetGoalInput]);

  const handleExportCsv = () => {
    if (!solution) return;

    const headers = ["Metric", "Current Baseline", "Desired Target Goal", "Required Input Variable", "Required % Adjustment"];
    const csvRows = [
      headers.map(h => `"${h}"`).join(","),
      [`"${activeTarget}"`, solution.currentTargetSum, solution.targetGoalValue, solution.requiredVariableSum, `"${solution.pctAdjustment}%"`].join(",")
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goal_seek_solver_${activeTarget}.csv`;
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
            📊 Interactive Metric Goal Seek & Target Solver
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Solves backward calculations: determines the required input variable adjustment needed to achieve a target goal metric.
          </p>
        </div>

        {solution && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Goal Seek Summary (CSV)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Target Metric (Y-Goal):</label>
          <select
            value={activeTarget}
            onChange={e => setTargetCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Adjustable Input Variable (X):</label>
          <select
            value={activeVariable}
            onChange={e => setVariableCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. Desired Target Goal Value ($):</label>
          <input
            type="number"
            value={targetGoalInput}
            onChange={e => setTargetGoalInput(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Goal Seek Scorecards */}
      {solution && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>Current Baseline {activeTarget}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", margin: "4px 0" }}>${solution.currentTargetSum.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#1D4ED8" }}>Current total in dataset</div>
            </div>

            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>Desired Target Goal</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", margin: "4px 0" }}>${solution.targetGoalValue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#047857" }}>Target metric goal</div>
            </div>

            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>Required {activeVariable}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", margin: "4px 0" }}>{solution.requiredVariableSum.toLocaleString()}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: solution.pctAdjustment >= 0 ? "#059669" : "#DC2626" }}>
                Requires {solution.pctAdjustment >= 0 ? `+${solution.pctAdjustment}%` : `${solution.pctAdjustment}%`} adjustment
              </div>
            </div>
          </div>

          {/* Goal Seek Comparison Bar Chart */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
              📊 Baseline vs Target Goal Scenario Comparison:
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={solution.chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey={activeTarget} name={`Target Metric (${activeTarget})`} fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey={activeVariable} name={`Required Variable (${activeVariable})`} fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
