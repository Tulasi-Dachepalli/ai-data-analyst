import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export function computeAbcClassification(data = [], itemCol = "", metricCol = "") {
  if (!data || data.length === 0 || !itemCol || !metricCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const grouped = {};
  let totalMetric = 0;

  evalRows.forEach(r => {
    const item = r[itemCol] !== undefined && r[itemCol] !== null ? String(r[itemCol]).trim() : "(blank)";
    const val = Number(r[metricCol]);
    if (!isNaN(val)) {
      grouped[item] = (grouped[item] || 0) + val;
      totalMetric += val;
    }
  });

  if (totalMetric <= 0) return null;

  const sortedItems = Object.entries(grouped)
    .map(([item, val]) => ({ item, value: +val.toFixed(2) }))
    .sort((a, b) => b.value - a.value);

  let runningSum = 0;
  const classA = [];
  const classB = [];
  const classC = [];

  const classifiedItems = sortedItems.map(item => {
    runningSum += item.value;
    const cumPct = +((runningSum / totalMetric) * 100).toFixed(1);
    const pctShare = +((item.value / totalMetric) * 100).toFixed(1);

    let classTier = "C";
    if (cumPct <= 70.0 || (classA.length === 0 && cumPct > 70.0)) {
      classTier = "A";
      classA.push(item);
    } else if (cumPct <= 90.0 || (classB.length === 0 && cumPct > 90.0)) {
      classTier = "B";
      classB.push(item);
    } else {
      classTier = "C";
      classC.push(item);
    }

    return {
      ...item,
      cumPct,
      pctShare,
      classTier
    };
  });

  const sumA = classA.reduce((a, b) => a + b.value, 0);
  const sumB = classB.reduce((a, b) => a + b.value, 0);
  const sumC = classC.reduce((a, b) => a + b.value, 0);

  const pieData = [
    { name: "Class A (Top 70% Value)", value: sumA, color: "#10B981", count: classA.length },
    { name: "Class B (Mid 20% Value)", value: sumB, color: "#3B82F6", count: classB.length },
    { name: "Class C (Bottom 10% Value)", value: sumC, color: "#F59E0B", count: classC.length }
  ];

  return {
    classifiedItems,
    totalMetric: +totalMetric.toFixed(2),
    summary: {
      a: { count: classA.length, val: +sumA.toFixed(2), pct: +((sumA / totalMetric) * 100).toFixed(1) },
      b: { count: classB.length, val: +sumB.toFixed(2), pct: +((sumB / totalMetric) * 100).toFixed(1) },
      c: { count: classC.length, val: +sumC.toFixed(2), pct: +((sumC / totalMetric) * 100).toFixed(1) }
    },
    pieData
  };
}

export default function AbcClassification({ data = [], columns = [] }) {
  const categoricalCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "string" || isNaN(Number(r[c])))) || columns;
  }, [columns, data]);

  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [itemCol, setItemCol] = useState("");
  const [metricCol, setMetricCol] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const activeItem = itemCol || categoricalCols[0] || columns[0] || "";
  const activeMetric = metricCol || numericCols[0] || "";

  const abc = useMemo(() => {
    if (!data || data.length === 0 || !activeItem || !activeMetric) return null;
    return computeAbcClassification(data, activeItem, activeMetric);
  }, [data, activeItem, activeMetric]);

  const filteredItems = useMemo(() => {
    if (!abc) return [];
    if (activeTab === "all") return abc.classifiedItems;
    return abc.classifiedItems.filter(i => i.classTier === activeTab.toUpperCase());
  }, [abc, activeTab]);

  const handleExportCsv = () => {
    if (!abc) return;

    const headers = [activeItem, activeMetric, "% Share", "Cumulative %", "ABC Class"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    abc.classifiedItems.forEach(item => {
      csvRows.push([`"${item.item}"`, item.value, `"${item.pctShare}%"`, `"${item.cumPct}%"`, `"${item.classTier}"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abc_classification_${activeItem}.csv`;
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
            📦 ABC Inventory & Revenue Categorization Matrix
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Partitions items into Class A (Top 70% Value), Class B (Mid 20% Value), and Class C (Bottom 10% Value).
          </p>
        </div>

        {abc && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export ABC Classification (CSV)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Select Item / Product Dimension:</label>
          <select
            value={activeItem}
            onChange={e => setItemCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Select Value Metric:</label>
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
      </div>

      {/* ABC Scorecards & Pie Chart */}
      {abc && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>🟢 Class A (High Priority)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#059669", margin: "4px 0" }}>{abc.summary.a.count} Items ({abc.summary.a.pct}%)</div>
              <div style={{ fontSize: 11, color: "#047857" }}>Value: ${abc.summary.a.val.toLocaleString()}</div>
            </div>

            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>🔵 Class B (Medium Priority)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#2563EB", margin: "4px 0" }}>{abc.summary.b.count} Items ({abc.summary.b.pct}%)</div>
              <div style={{ fontSize: 11, color: "#1D4ED8" }}>Value: ${abc.summary.b.val.toLocaleString()}</div>
            </div>

            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>🟡 Class C (Low Priority)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#D97706", margin: "4px 0" }}>{abc.summary.c.count} Items ({abc.summary.c.pct}%)</div>
              <div style={{ fontSize: 11, color: "#B45309" }}>Value: ${abc.summary.c.val.toLocaleString()}</div>
            </div>
          </div>

          {/* Pie Chart Distribution */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
              📊 ABC Metric Share Distribution:
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={abc.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={d => d.name}>
                  {abc.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Tabs & Table */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["all", "a", "b", "c"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? "#3E6F8E" : "#F3F4F6",
                  color: activeTab === tab ? "#FFF" : "#374151",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {tab === "all" ? "All Items" : `Class ${tab.toUpperCase()} Only`}
              </button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Rank</th>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>{activeItem}</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>{activeMetric}</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>% Share</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Cumulative %</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>ABC Class</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.slice(0, 50).map((item, idx) => (
                  <tr key={item.item} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>#{idx + 1}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.item}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{item.value.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.pctShare}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#6B7280" }}>{item.cumPct}%</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {item.classTier === "A" && <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Class A</span>}
                      {item.classTier === "B" && <span style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Class B</span>}
                      {item.classTier === "C" && <span style={{ backgroundColor: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Class C</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
