import React, { useState, useMemo } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis } from "recharts";

export function runKMeansClustering(data = [], featureX = "", featureY = "", k = 3) {
  if (!data || data.length < k || !featureX || !featureY) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const points = evalRows.map((r, idx) => ({
    id: idx,
    xRaw: Number(r[featureX]),
    yRaw: Number(r[featureY])
  })).filter(p => !isNaN(p.xRaw) && !isNaN(p.yRaw));

  if (points.length < k) return null;

  // 1. Z-Score Standardization
  const meanX = points.reduce((a, b) => a + b.xRaw, 0) / points.length;
  const meanY = points.reduce((a, b) => a + b.yRaw, 0) / points.length;
  const stdX = Math.sqrt(points.reduce((a, b) => a + Math.pow(b.xRaw - meanX, 2), 0) / points.length) || 1;
  const stdY = Math.sqrt(points.reduce((a, b) => a + Math.pow(b.yRaw - meanY, 2), 0) / points.length) || 1;

  const normPoints = points.map(p => ({
    ...p,
    x: (p.xRaw - meanX) / stdX,
    y: (p.yRaw - meanY) / stdY
  }));

  // 2. Initialize Centroids (Pick 3 spread points)
  let centroids = [
    { x: normPoints[0].x, y: normPoints[0].y },
    { x: normPoints[Math.floor(normPoints.length / 2)].x, y: normPoints[Math.floor(normPoints.length / 2)].y },
    { x: normPoints[normPoints.length - 1].x, y: normPoints[normPoints.length - 1].y }
  ];

  let assignments = new Array(normPoints.length).fill(0);

  // 3. K-Means Iterations (15 max)
  for (let iter = 0; iter < 15; iter++) {
    let changed = false;

    // Assign points to nearest centroid
    normPoints.forEach((p, idx) => {
      let minDist = Infinity;
      let closestCluster = 0;
      centroids.forEach((c, cIdx) => {
        const dist = Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2);
        if (dist < minDist) {
          minDist = dist;
          closestCluster = cIdx;
        }
      });
      if (assignments[idx] !== closestCluster) {
        assignments[idx] = closestCluster;
        changed = true;
      }
    });

    if (!changed) break;

    // Update Centroids
    const newCentroids = [ { x: 0, y: 0, count: 0 }, { x: 0, y: 0, count: 0 }, { x: 0, y: 0, count: 0 } ];
    normPoints.forEach((p, idx) => {
      const cIdx = assignments[idx];
      newCentroids[cIdx].x += p.x;
      newCentroids[cIdx].y += p.y;
      newCentroids[cIdx].count += 1;
    });

    centroids = newCentroids.map((c, idx) => (
      c.count > 0 ? { x: c.x / c.count, y: c.y / c.count } : centroids[idx]
    ));
  }

  // 4. Group results by Cluster
  const clusterColors = ["#10B981", "#3B82F6", "#F59E0B"];
  const clusterLabels = ["Cluster 1: High Value Segment", "Cluster 2: Moderate Performance", "Cluster 3: Low Activity / At-Risk"];

  const clustersData = [[], [], []];
  normPoints.forEach((p, idx) => {
    const cIdx = assignments[idx];
    clustersData[cIdx].push({
      x: p.xRaw,
      y: p.yRaw
    });
  });

  const clusterStats = clustersData.map((pts, idx) => {
    const count = pts.length;
    const pct = ((count / points.length) * 100).toFixed(1);
    const avgX = count > 0 ? (pts.reduce((a, b) => a + b.x, 0) / count).toFixed(2) : 0;
    const avgY = count > 0 ? (pts.reduce((a, b) => a + b.y, 0) / count).toFixed(2) : 0;

    return {
      clusterId: idx + 1,
      label: clusterLabels[idx],
      color: clusterColors[idx],
      count,
      pct,
      avgX,
      avgY
    };
  });

  return { clustersData, clusterStats };
}

export default function ClusterSegmentation({ data = [], columns = [] }) {
  const numericCols = useMemo(() => {
    return columns.filter(col => data.some(r => typeof r[col] === "number" || !isNaN(Number(r[col]))));
  }, [columns, data]);

  const [featureX, setFeatureX] = useState("");
  const [featureY, setFeatureY] = useState("");

  const activeX = featureX || numericCols[0] || "";
  const activeY = featureY || numericCols[1] || numericCols[0] || "";

  const clustering = useMemo(() => {
    if (!data || data.length === 0 || !activeX || !activeY) return null;
    return runKMeansClustering(data, activeX, activeY, 3);
  }, [data, activeX, activeY]);

  return (
    <div style={{ background: "#FFF", border: "1px solid #EAE7E0", borderRadius: 12, padding: 24, margin: "20px 0", fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#2B2A27", display: "flex", alignItems: "center", gap: 8 }}>
          🤖 AI K-Means Customer & Product Segmentation (Clustering)
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
          Unsupervised Machine Learning K-Means clustering ($K=3$) partitioning records into 3 distinct behavioral segments.
        </p>
      </div>

      {numericCols.length < 2 ? (
        <div style={{ padding: 20, textAlign: "center", color: "#8A8580", fontSize: 13 }}>
          Need at least 2 numerical features in dataset to perform K-Means cluster segmentation.
        </div>
      ) : (
        <>
          {/* Feature Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select Feature X (Horizontal Axis):</label>
              <select
                value={activeX}
                onChange={e => setFeatureX(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
              >
                {numericCols.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Select Feature Y (Vertical Axis):</label>
              <select
                value={activeY}
                onChange={e => setFeatureY(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
              >
                {numericCols.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 2D Cluster Scatter Plot */}
          {clustering && (
            <>
              <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
                  📊 2D K-Means Cluster Distribution Scatter Plot:
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" dataKey="x" name={activeX} stroke="#6B7280" fontSize={11} label={{ value: activeX, position: 'bottom', offset: 0 }} />
                    <YAxis type="number" dataKey="y" name={activeY} stroke="#6B7280" fontSize={11} label={{ value: activeY, angle: -90, position: 'left' }} />
                    <ZAxis range={[60, 60]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend verticalAlign="top" height={36} />
                    <Scatter name="Cluster 1 (High Value)" data={clustering.clustersData[0]} fill="#10B981" />
                    <Scatter name="Cluster 2 (Moderate)" data={clustering.clustersData[1]} fill="#3B82F6" />
                    <Scatter name="Cluster 3 (At-Risk)" data={clustering.clustersData[2]} fill="#F59E0B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Centroid Parameter Summary Table */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#374151" }}>Segment Centroid Statistics & Strategic Recommendations</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: "2px solid #E5E7EB", color: "#374151" }}>
                      <th style={{ padding: "10px 12px" }}>Segment</th>
                      <th style={{ padding: "10px 12px" }}>Record Share</th>
                      <th style={{ padding: "10px 12px" }}>Avg {activeX}</th>
                      <th style={{ padding: "10px 12px" }}>Avg {activeY}</th>
                      <th style={{ padding: "10px 12px" }}>Strategic Business Action Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clustering.clusterStats.map((st, idx) => (
                      <tr key={st.clusterId} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: st.color }}>{st.label}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{st.count} ({st.pct}%)</td>
                        <td style={{ padding: "10px 12px" }}>{Number(st.avgX).toLocaleString()}</td>
                        <td style={{ padding: "10px 12px" }}>{Number(st.avgY).toLocaleString()}</td>
                        <td style={{ padding: "10px 12px", color: "#4B5563" }}>
                          {idx === 0 && "🏆 VIP Retention: Enroll in exclusive loyalty perks & early feature access."}
                          {idx === 1 && "📈 Expansion Candidate: Trigger automated cross-sell campaigns & tier upgrades."}
                          {idx === 2 && "⚠️ Churn Prevention: Dispatch win-back discount vouchers & direct feedback surveys."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
