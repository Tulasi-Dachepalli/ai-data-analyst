import React, { useMemo } from "react";

export function calculateLinearRegression(chartData = []) {
  if (!chartData || chartData.length < 2) return null;

  const validPoints = chartData.map((d, idx) => ({
    x: idx,
    y: Number(d.value) || 0,
    label: d.group
  })).filter(p => !isNaN(p.y));

  const n = validPoints.length;
  if (n < 2) return null;

  const sumX = validPoints.reduce((acc, p) => acc + p.x, 0);
  const sumY = validPoints.reduce((acc, p) => acc + p.y, 0);
  const sumXY = validPoints.reduce((acc, p) => acc + p.x * p.y, 0);
  const sumXX = validPoints.reduce((acc, p) => acc + p.x * p.x, 0);

  const meanY = sumY / n;

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (Coefficient of Determination)
  let ssTot = 0;
  let ssRes = 0;

  validPoints.forEach(p => {
    const yPred = slope * p.x + intercept;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  });

  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  const startVal = validPoints[0].y;
  const endVal = validPoints[n - 1].y;
  const pctChange = startVal !== 0 ? (((endVal - startVal) / Math.abs(startVal)) * 100).toFixed(1) : 0;

  const augmentedData = chartData.map((d, idx) => ({
    ...d,
    trendline: +(slope * idx + intercept).toFixed(2)
  }));

  return {
    slope: +slope.toFixed(2),
    intercept: +intercept.toFixed(2),
    rSquared: +(rSquared * 100).toFixed(1),
    pctChange,
    direction: slope > 0 ? "Upward Growth" : slope < 0 ? "Downward Decline" : "Flat Momentum",
    confidence: rSquared >= 0.75 ? "High Confidence" : rSquared >= 0.4 ? "Moderate Confidence" : "Low Fit",
    augmentedData
  };
}

export default function RegressionTrendline({ chartData = [], metricLabel = "Value" }) {
  const regression = useMemo(() => calculateLinearRegression(chartData), [chartData]);

  if (!regression) return null;

  const isPositive = regression.slope >= 0;

  return (
    <div style={{ backgroundColor: isPositive ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${isPositive ? "#BBF7D0" : "#FCA5A5"}`, borderRadius: 8, padding: "10px 14px", margin: "10px 0", fontSize: 12.5, color: isPositive ? "#166534" : "#991B1B" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{isPositive ? "📈" : "📉"}</span>
          <span>Regression Velocity: {regression.direction} ({regression.pctChange > 0 ? `+${regression.pctChange}%` : `${regression.pctChange}%`})</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 11.5, backgroundColor: isPositive ? "#DCFCE7" : "#FEE2E2", padding: "2px 8px", borderRadius: 6 }}>
          Model Confidence R² = {regression.rSquared}% ({regression.confidence})
        </div>
      </div>
      <div style={{ fontSize: 11, color: isPositive ? "#15803D" : "#B91C1C", marginTop: 4 }}>
        Equation: <code>y = {regression.slope}x + {regression.intercept}</code> &middot; Rate of Change: {regression.slope > 0 ? `+${regression.slope}` : regression.slope} {metricLabel} per period.
      </div>
    </div>
  );
}
