import React, { useMemo } from "react";

export function computePearsonCorrelation(xVals, yVals) {
  const n = Math.min(xVals.length, yVals.length);
  if (n < 2) return 0;

  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = xVals[i] - meanX;
    const diffY = yVals[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : +(num / den).toFixed(2);
}

export default function CorrelationHeatmap({ data = [], columns = [] }) {
  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const matrixData = useMemo(() => {
    if (!data || data.length === 0 || numericCols.length === 0) return null;

    // Use high-speed sampling for datasets > 5000 rows
    const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

    const colVectors = {};
    numericCols.forEach(col => {
      colVectors[col] = evalRows.map(r => Number(r[col])).filter(v => !isNaN(v));
    });

    const matrix = {};
    const findings = [];

    numericCols.forEach(colA => {
      matrix[colA] = {};
      numericCols.forEach(colB => {
        if (colA === colB) {
          matrix[colA][colB] = 1.0;
        } else {
          const r = computePearsonCorrelation(colVectors[colA], colVectors[colB]);
          matrix[colA][colB] = r;

          if (numericCols.indexOf(colA) < numericCols.indexOf(colB) && Math.abs(r) >= 0.5) {
            findings.push({
              colA,
              colB,
              r,
              strength: Math.abs(r) >= 0.8 ? "Strong" : "Moderate",
              direction: r > 0 ? "Positive" : "Negative"
            });
          }
        }
      });
    });

    return { matrix, findings: findings.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)) };
  }, [data, numericCols]);

  if (!matrixData || numericCols.length < 2) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
        📊 Need at least 2 numerical attributes in dataset to render Correlation Matrix Heatmap.
      </div>
    );
  }

  const { matrix, findings } = matrixData;

  const getCellColor = (r) => {
    if (r === 1) return "#E5E7EB";
    if (r > 0) return `rgba(16, 185, 129, ${Math.min(1, r * 0.75 + 0.15)})`;
    if (r < 0) return `rgba(239, 68, 68, ${Math.min(1, Math.abs(r) * 0.75 + 0.15)})`;
    return "#F3F4F6";
  };

  const getTextColor = (r) => {
    if (Math.abs(r) > 0.5 && r !== 1) return "#FFF";
    return "#1F2937";
  };

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          📊 Pearson Correlation Matrix Heatmap
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Color-coded correlation coefficients ($r \in [-1, 1]$) identifying mathematical relationships between numerical fields.
        </p>
      </div>

      {/* Heatmap Matrix Table */}
      <div style={{ overflowX: "auto", marginBottom: 20 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ padding: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", textTransform: "uppercase", fontSize: 11, color: "#6B7280" }}>
                Variables
              </th>
              {numericCols.map(col => (
                <th key={col} style={{ padding: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", fontWeight: 700, color: "#374151" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {numericCols.map(colA => (
              <tr key={colA}>
                <td style={{ padding: 10, background: "#F9FAFB", border: "1px solid #E5E7EB", fontWeight: 700, color: "#374151", textAlign: "left" }}>
                  {colA}
                </td>
                {numericCols.map(colB => {
                  const rVal = matrix[colA][colB];
                  return (
                    <td
                      key={colB}
                      title={`${colA} vs ${colB}: r = ${rVal}`}
                      style={{
                        padding: 12,
                        border: "1px solid #FFF",
                        backgroundColor: getCellColor(rVal),
                        color: getTextColor(rVal),
                        fontWeight: Math.abs(rVal) > 0.5 ? 800 : 500,
                        fontSize: 13,
                        transition: "transform 0.15s ease"
                      }}
                    >
                      {rVal > 0 && rVal !== 1 ? `+${rVal}` : rVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Correlation Takeaways Box */}
      {findings.length > 0 && (
        <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 8, textTransform: "uppercase" }}>
            💡 Key Correlation Findings:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#15803D" }}>
            {findings.map((f, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>{f.direction === "Positive" ? "📈" : "📉"}</span>
                <span>
                  <strong>{f.colA}</strong> and <strong>{f.colB}</strong> exhibit a <strong>{f.strength} {f.direction}</strong> correlation (<strong>r = {f.r > 0 ? `+${f.r}` : f.r}</strong>).
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
