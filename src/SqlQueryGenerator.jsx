import React, { useState, useMemo } from "react";

export function generateSqlFromPrompt(prompt = "", columns = []) {
  const p = prompt.toLowerCase();
  
  const numericCols = columns.filter(c => /sale|revenue|price|amount|cost|total|profit|score|val|count/i.test(c)) || columns;
  const metricCol = numericCols[0] || columns[0] || "Value";

  const groupCols = columns.filter(c => /region|category|status|type|country|state|city|name|department|auditor|risk/i.test(c));
  const groupCol = groupCols[0] || columns.find(c => c !== metricCol) || "Group";

  const isAvg = p.includes("avg") || p.includes("average") || p.includes("mean");
  const isCount = p.includes("count") || p.includes("number of");
  const isMin = p.includes("min") || p.includes("lowest");
  const isMax = p.includes("max") || p.includes("highest");

  const limitMatch = p.match(/limit\s+(\d+)|top\s+(\d+)/);
  const limit = limitMatch ? (limitMatch[1] || limitMatch[2]) : 10;

  let aggFunc = "SUM";
  let aggAlias = `Total_${metricCol}`;
  if (isAvg) { aggFunc = "AVG"; aggAlias = `Avg_${metricCol}`; }
  else if (isCount) { aggFunc = "COUNT"; aggAlias = `Record_Count`; }
  else if (isMin) { aggFunc = "MIN"; aggAlias = `Min_${metricCol}`; }
  else if (isMax) { aggFunc = "MAX"; aggAlias = `Max_${metricCol}`; }

  const sql = `SELECT \`${groupCol}\`, ${aggFunc}(\`${metricCol}\`) AS \`${aggAlias}\`
FROM dataset
GROUP BY \`${groupCol}\`
ORDER BY \`${aggAlias}\` DESC
LIMIT ${limit};`;

  return { sql, groupCol, metricCol, aggFunc, aggAlias, limit: Number(limit) };
}

export function executeSqlInMemory(rows = [], querySpec) {
  if (!rows || rows.length === 0 || !querySpec) return { results: [], cols: [] };

  const { groupCol, metricCol, aggFunc, aggAlias, limit } = querySpec;
  const groups = {};

  rows.forEach(r => {
    const gVal = r[groupCol] !== undefined && r[groupCol] !== null && String(r[groupCol]).trim() !== "" ? String(r[groupCol]) : "(blank)";
    const numVal = Number(r[metricCol]);
    
    if (!groups[gVal]) {
      groups[gVal] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    }

    groups[gVal].count += 1;
    if (!isNaN(numVal)) {
      groups[gVal].sum += numVal;
      groups[gVal].min = Math.min(groups[gVal].min, numVal);
      groups[gVal].max = Math.max(groups[gVal].max, numVal);
    }
  });

  const results = Object.entries(groups).map(([gVal, stats]) => {
    let val = 0;
    if (aggFunc === "SUM") val = stats.sum;
    else if (aggFunc === "AVG") val = stats.count ? stats.sum / stats.count : 0;
    else if (aggFunc === "COUNT") val = stats.count;
    else if (aggFunc === "MIN") val = stats.min === Infinity ? 0 : stats.min;
    else if (aggFunc === "MAX") val = stats.max === -Infinity ? 0 : stats.max;

    return {
      [groupCol]: gVal,
      [aggAlias]: +val.toFixed(2)
    };
  });

  results.sort((a, b) => b[aggAlias] - a[aggAlias]);
  const finalResults = results.slice(0, limit);
  const cols = [groupCol, aggAlias];

  return { results: finalResults, cols };
}

export default function SqlQueryGenerator({ data = [], columns = [] }) {
  const [prompt, setPrompt] = useState("Show top 5 categories by total revenue");
  const [copied, setCopied] = useState(false);

  const querySpec = useMemo(() => {
    if (!columns || columns.length === 0) return null;
    return generateSqlFromPrompt(prompt, columns);
  }, [prompt, columns]);

  const execution = useMemo(() => {
    if (!data || data.length === 0 || !querySpec) return null;
    return executeSqlInMemory(data, querySpec);
  }, [data, querySpec]);

  const handleCopySql = () => {
    if (!querySpec) return;
    navigator.clipboard.writeText(querySpec.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    if (!execution || !execution.results || execution.results.length === 0) return;

    const cols = execution.cols;
    const csvRows = [cols.join(",")];

    execution.results.forEach(r => {
      csvRows.push(cols.map(c => `"${r[c] ?? ""}"`).join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sql_query_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          ⚡ AI SQL Query Generator & Live Executor
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Convert natural language questions into ANSI SQL queries, execute them in real time, and export query result sets.
        </p>
      </div>

      {/* Prompt Bar & Templates */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          Enter Natural Language Query Prompt:
        </label>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Show average revenue by region limit 10..."
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13.5, boxSizing: "border-box", marginBottom: 10 }}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Quick Templates:</span>
          {["Top 5 Categories by Total", "Average Value by Region", "Record Count by Status", "Lowest Minimum Value by Group"].map(tpl => (
            <button
              key={tpl}
              onClick={() => setPrompt(tpl)}
              style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 10px", fontSize: 11.5, color: "#374151", cursor: "pointer" }}
            >
              💡 {tpl}
            </button>
          ))}
        </div>
      </div>

      {querySpec && (
        <>
          {/* Generated SQL Code Box */}
          <div style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 16, marginBottom: 20, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid #333", paddingBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>ANSI SQL Query</span>
              <button
                onClick={handleCopySql}
                style={{ backgroundColor: copied ? "#10B981" : "#374151", color: "#FFF", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
              >
                {copied ? "✅ Copied SQL!" : "📋 Copy SQL"}
              </button>
            </div>
            <pre style={{ margin: 0, fontFamily: "'IBM Plex Mono', Consolas, monospace", fontSize: 13, color: "#38BDF8", lineHeight: 1.5, overflowX: "auto" }}>
              {querySpec.sql}
            </pre>
          </div>

          {/* Live Execution Results Table */}
          {execution && execution.results.length > 0 && (
            <div style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>
                  ⚡ Live Execution Results ({execution.results.length} rows returned):
                </div>
                <button
                  onClick={handleExportCsv}
                  style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  📥 Export SQL Results (CSV)
                </button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                    {execution.cols.map(c => (
                      <th key={c} style={{ padding: "8px 12px", fontWeight: 700, color: "#374151" }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {execution.results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: idx % 2 === 0 ? "#FFF" : "#F9FAFB" }}>
                      {execution.cols.map(c => (
                        <td key={c} style={{ padding: "8px 12px", color: typeof r[c] === "number" ? "#3E6F8E" : "#1F2937", fontWeight: typeof r[c] === "number" ? 700 : 400 }}>
                          {r[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
