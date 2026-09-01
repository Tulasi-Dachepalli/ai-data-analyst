import React, { useState, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";

export function generateTimeSeriesForecast(data = [], dateCol = "", metricCol = "", horizon = 6) {
  if (!data || data.length === 0 || !dateCol || !metricCol) return null;

  // Filter & sort valid date/numeric points
  const points = data
    .map(r => ({
      dateRaw: r[dateCol],
      dateObj: new Date(r[dateCol]),
      val: Number(r[metricCol])
    }))
    .filter(p => p.dateRaw && !isNaN(p.dateObj.getTime()) && !isNaN(p.val))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  if (points.length < 5) return null;

  // Use sampling for datasets > 5000 rows
  const evalPoints = points.length > 5000 ? points.slice(points.length - 5000) : points;

  // Fit Exponential Smoothing (Double Holt's Linear Trend)
  let level = evalPoints[0].val;
  let trend = (evalPoints[evalPoints.length - 1].val - evalPoints[0].val) / evalPoints.length;
  const alpha = 0.3;
  const beta = 0.1;

  const fitted = [];
  const residuals = [];

  evalPoints.forEach(p => {
    const prevLevel = level;
    const prevTrend = trend;
    level = alpha * p.val + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    const pred = prevLevel + prevTrend;
    fitted.push(pred);
    residuals.push(p.val - pred);
  });

  const mse = residuals.reduce((a, b) => a + Math.pow(b, 2), 0) / residuals.length;
  const stdErr = Math.sqrt(mse) || 1;

  // Build combined chart data
  const chartData = evalPoints.map(p => ({
    date: p.dateObj.toISOString().slice(0, 10),
    actual: +p.val.toFixed(2),
    forecast: null,
    upperBound: null,
    lowerBound: null
  }));

  const lastDate = new Date(evalPoints[evalPoints.length - 1].dateObj);
  const futurePoints = [];

  for (let h = 1; h <= horizon; h++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + h * 30); // Monthly intervals
    const predVal = level + h * trend;
    const margin = 1.96 * stdErr * Math.sqrt(h);

    const fObj = {
      date: futureDate.toISOString().slice(0, 10) + " (FC)",
      actual: null,
      forecast: +Math.max(0, predVal).toFixed(2),
      upperBound: +(predVal + margin).toFixed(2),
      lowerBound: +Math.max(0, predVal - margin).toFixed(2)
    };

    futurePoints.push(fObj);
    chartData.push(fObj);
  }

  const lastActual = evalPoints[evalPoints.length - 1].val;
  const finalForecast = futurePoints[futurePoints.length - 1].forecast;
  const pctChange = lastActual > 0 ? +(((finalForecast - lastActual) / lastActual) * 100).toFixed(1) : 0;

  return { chartData, futurePoints, lastActual, finalForecast, pctChange, stdErr: +stdErr.toFixed(2) };
}

export default function TimeSeriesForecasting({ data = [], columns = [] }) {
  const dateCols = useMemo(() => {
    return columns.filter(c => /date|time|created|joined|month|year|timestamp/i.test(c)) || columns;
  }, [columns]);

  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [dateCol, setDateCol] = useState("");
  const [metricCol, setMetricCol] = useState("");
  const [horizon, setHorizon] = useState(6);

  const activeDate = dateCol || dateCols[0] || columns[0] || "";
  const activeMetric = metricCol || numericCols[0] || "";

  const forecast = useMemo(() => {
    if (!data || data.length === 0 || !activeDate || !activeMetric) return null;
    return generateTimeSeriesForecast(data, activeDate, activeMetric, horizon);
  }, [data, activeDate, activeMetric, horizon]);

  const handleExportCsv = () => {
    if (!forecast) return;

    const headers = ["Date", "Actual Value", "Forecasted Value", "Upper 95% Bound", "Lower 95% Bound"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    forecast.chartData.forEach(row => {
      csvRows.push([
        `"${row.date}"`,
        row.actual !== null ? row.actual : "",
        row.forecast !== null ? row.forecast : "",
        row.upperBound !== null ? row.upperBound : "",
        row.lowerBound !== null ? row.lowerBound : ""
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time_series_forecast_${activeMetric}.csv`;
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
            🔮 AI Predictive Time-Series Forecasting Engine
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Extrapolates future metric trends (Holt's Exponential Smoothing) with 95% confidence interval bounds.
          </p>
        </div>

        {forecast && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export Forecast (CSV)
          </button>
        )}
      </div>

      {/* Selector Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Select Date Field (X-Axis):</label>
          <select
            value={activeDate}
            onChange={e => setDateCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Select Metric to Forecast (Y-Axis):</label>
          <select
            value={activeMetric}
            onChange={e => setMetricCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. Forecast Horizon:</label>
          <select
            value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            <option value={3}>3 Periods (Quarterly)</option>
            <option value={6}>6 Periods (Half-Year)</option>
            <option value={12}>12 Periods (Full Year)</option>
          </select>
        </div>
      </div>

      {/* Forecast Chart & Table */}
      {forecast ? (
        <>
          {/* Strategic Takeaway Banner */}
          <div style={{ backgroundColor: forecast.pctChange >= 0 ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${forecast.pctChange >= 0 ? "#A7F3D0" : "#FCA5A5"}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: forecast.pctChange >= 0 ? "#065F46" : "#991B1B", marginBottom: 4 }}>
              📈 Projected Trend Outcome ({horizon} Periods Ahead):
            </div>
            <div style={{ fontSize: 13, color: forecast.pctChange >= 0 ? "#047857" : "#B91C1C", lineHeight: 1.5 }}>
              • Projected {activeMetric}: <strong>{forecast.finalForecast.toLocaleString()}</strong> (compared to current {forecast.lastActual.toLocaleString()}).<br />
              • Expected Metric Growth: <strong>{forecast.pctChange >= 0 ? `+${forecast.pctChange}%` : `${forecast.pctChange}%`}</strong> over the forecast horizon.
            </div>
          </div>

          {/* Forecast Chart */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={forecast.chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} angle={-20} textAnchor="end" height={44} />
                <YAxis stroke="#3E6F8E" fontSize={11} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="actual" name="Historical Actual" stroke="#3E6F8E" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="forecast" name="AI Projected Forecast" stroke="#10B981" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="upperBound" name="95% Upper Bound" stroke="#94A3B8" strokeWidth={1} strokeDasharray="2 2" dot={false} />
                <Line type="monotone" dataKey="lowerBound" name="95% Lower Bound" stroke="#94A3B8" strokeWidth={1} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Summary Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Forecast Period</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Projected {activeMetric}</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>95% Lower Bound</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>95% Upper Bound</th>
                </tr>
              </thead>
              <tbody>
                {forecast.futurePoints.map((fp, idx) => (
                  <tr key={fp.date} style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F0FDF4" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#065F46" }}>Period #{idx + 1} ({fp.date})</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#10B981" }}>{fp.forecast.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>{fp.lowerBound.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748B" }}>{fp.upperBound.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          Please select a valid Date column and numerical metric to run time-series forecasting.
        </div>
      )}
    </div>
  );
}
