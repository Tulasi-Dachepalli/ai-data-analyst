import React, { useState, useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export function computeRfmSegmentation(data = [], customerCol = "", dateCol = "", monetaryCol = "") {
  if (!data || data.length === 0 || !customerCol || !dateCol || !monetaryCol) return null;

  // Use sampling for datasets > 5000 rows
  const evalRows = data.length > 5000 ? data.slice(0, 5000) : data;

  const grouped = {};
  let maxDateMs = 0;

  evalRows.forEach(r => {
    const customer = r[customerCol] !== undefined && r[customerCol] !== null ? String(r[customerCol]).trim() : "(blank)";
    const dateObj = new Date(r[dateCol]);
    const val = Number(r[monetaryCol]);

    if (customer && !isNaN(dateObj.getTime()) && !isNaN(val)) {
      if (dateObj.getTime() > maxDateMs) maxDateMs = dateObj.getTime();

      if (!grouped[customer]) {
        grouped[customer] = { customer, lastDateMs: dateObj.getTime(), frequency: 0, monetary: 0 };
      }
      if (dateObj.getTime() > grouped[customer].lastDateMs) {
        grouped[customer].lastDateMs = dateObj.getTime();
      }
      grouped[customer].frequency += 1;
      grouped[customer].monetary += val;
    }
  });

  const customers = Object.values(grouped);
  if (customers.length === 0 || maxDateMs === 0) return null;

  const nowMs = maxDateMs;
  customers.forEach(c => {
    c.recencyDays = Math.max(0, Math.floor((nowMs - c.lastDateMs) / (1000 * 60 * 60 * 24)));
    c.monetary = +c.monetary.toFixed(2);
  });

  // Calculate Scores (1 to 5)
  const sortedR = [...customers].sort((a, b) => a.recencyDays - b.recencyDays);
  const sortedF = [...customers].sort((a, b) => b.frequency - a.frequency);
  const sortedM = [...customers].sort((a, b) => b.monetary - a.monetary);

  const n = customers.length;
  customers.forEach(c => {
    const rankR = sortedR.findIndex(x => x.customer === c.customer);
    const rankF = sortedF.findIndex(x => x.customer === c.customer);
    const rankM = sortedM.findIndex(x => x.customer === c.customer);

    c.rScore = Math.ceil(5 * (1 - rankR / n)) || 1;
    c.fScore = Math.ceil(5 * (1 - rankF / n)) || 1;
    c.mScore = Math.ceil(5 * (1 - rankM / n)) || 1;

    // Segment Assignment
    if (c.rScore >= 4 && c.fScore >= 4 && c.mScore >= 4) {
      c.segment = "Champions";
    } else if (c.rScore >= 3 && c.fScore >= 3) {
      c.segment = "Loyal Customers";
    } else if (c.rScore <= 2 && (c.fScore >= 3 || c.mScore >= 3)) {
      c.segment = "At Risk";
    } else {
      c.segment = "Lost";
    }
  });

  const segCounts = { Champions: 0, "Loyal Customers": 0, "At Risk": 0, Lost: 0 };
  const segValues = { Champions: 0, "Loyal Customers": 0, "At Risk": 0, Lost: 0 };

  customers.forEach(c => {
    segCounts[c.segment] = (segCounts[c.segment] || 0) + 1;
    segValues[c.segment] = (segValues[c.segment] || 0) + c.monetary;
  });

  const pieData = [
    { name: "Champions", value: segCounts.Champions, color: "#10B981" },
    { name: "Loyal Customers", value: segCounts["Loyal Customers"], color: "#3B82F6" },
    { name: "At Risk", value: segCounts["At Risk"], color: "#F59E0B" },
    { name: "Lost / Lapsed", value: segCounts.Lost, color: "#EF4444" }
  ];

  return { customers, segCounts, segValues: {
    Champions: +segValues.Champions.toFixed(2),
    "Loyal Customers": +segValues["Loyal Customers"].toFixed(2),
    "At Risk": +segValues["At Risk"].toFixed(2),
    Lost: +segValues.Lost.toFixed(2)
  }, pieData };
}

export default function RfmSegmentation({ data = [], columns = [] }) {
  const customerCols = useMemo(() => {
    return columns.filter(c => /customer|user|client|id|account|member/i.test(c)) || columns;
  }, [columns]);

  const dateCols = useMemo(() => {
    return columns.filter(c => /date|time|created|joined|order/i.test(c)) || columns;
  }, [columns]);

  const numericCols = useMemo(() => {
    return columns.filter(c => data.some(r => typeof r[c] === "number" || !isNaN(Number(r[c]))));
  }, [columns, data]);

  const [customerCol, setCustomerCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [monetaryCol, setMonetaryCol] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const activeCustomer = customerCol || customerCols[0] || columns[0] || "";
  const activeDate = dateCol || dateCols[0] || columns[0] || "";
  const activeMonetary = monetaryCol || numericCols[0] || "";

  const rfm = useMemo(() => {
    if (!data || data.length === 0 || !activeCustomer || !activeDate || !activeMonetary) return null;
    return computeRfmSegmentation(data, activeCustomer, activeDate, activeMonetary);
  }, [data, activeCustomer, activeDate, activeMonetary]);

  const filteredCustomers = useMemo(() => {
    if (!rfm) return [];
    if (activeTab === "all") return rfm.customers;
    return rfm.customers.filter(c => c.segment.toLowerCase().includes(activeTab.toLowerCase()));
  }, [rfm, activeTab]);

  const handleExportCsv = () => {
    if (!rfm) return;

    const headers = ["Customer ID", "Recency (Days)", "Frequency (Orders)", "Monetary Total", "R Score", "F Score", "M Score", "Segment"];
    const csvRows = [headers.map(h => `"${h}"`).join(",")];

    rfm.customers.forEach(c => {
      csvRows.push([`"${c.customer}"`, c.recencyDays, c.frequency, c.monetary, c.rScore, c.fScore, c.mScore, `"${c.segment}"`].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rfm_segmentation_${activeCustomer}.csv`;
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
            🏷️ AI RFM Customer Loyalty & Churn Risk Segmentation
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#666" }}>
            Calculates RFM scores (1 to 5) and segments users into Champions, Loyal Customers, At Risk, and Lost tiers.
          </p>
        </div>

        {rfm && (
          <button
            onClick={handleExportCsv}
            style={{ backgroundColor: "#10B981", color: "#FFF", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            📥 Export RFM Segments (CSV)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, background: "#F9FAFB", padding: 16, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>1. Customer ID Column:</label>
          <select
            value={activeCustomer}
            onChange={e => setCustomerCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>2. Transaction Date Column:</label>
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
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>3. Monetary Value Column:</label>
          <select
            value={activeMonetary}
            onChange={e => setMonetaryCol(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, backgroundColor: "#FFF" }}
          >
            {numericCols.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RFM Scorecards & Pie Chart */}
      {rfm && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase" }}>🟢 Champions</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", margin: "2px 0" }}>{rfm.segCounts.Champions} Users</div>
              <div style={{ fontSize: 11, color: "#047857" }}>Value: ${rfm.segValues.Champions.toLocaleString()}</div>
            </div>

            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>🔵 Loyal Customers</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", margin: "2px 0" }}>{rfm.segCounts["Loyal Customers"]} Users</div>
              <div style={{ fontSize: 11, color: "#1D4ED8" }}>Value: ${rfm.segValues["Loyal Customers"].toLocaleString()}</div>
            </div>

            <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase" }}>🟡 At Risk (Churn Alert)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706", margin: "2px 0" }}>{rfm.segCounts["At Risk"]} Users</div>
              <div style={{ fontSize: 11, color: "#B45309" }}>Value: ${rfm.segValues["At Risk"].toLocaleString()}</div>
            </div>

            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>🔴 Lost / Lapsed</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626", margin: "2px 0" }}>{rfm.segCounts.Lost} Users</div>
              <div style={{ fontSize: 11, color: "#7F1D1D" }}>Value: ${rfm.segValues.Lost.toLocaleString()}</div>
            </div>
          </div>

          {/* Pie Chart Distribution */}
          <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937", marginBottom: 12 }}>
              📊 RFM Customer Segment Share:
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={rfm.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={d => `${d.name}: ${d.value}`}>
                  {rfm.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Filter Tabs & Customer Table */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "champions", "loyal", "at risk", "lost"].map(tab => (
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
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {tab === "all" ? "All Customers" : tab}
              </button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "2px solid #E5E7EB" }}>
                  <th style={{ padding: "10px 12px", color: "#374151" }}>Customer ID</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Recency (Days)</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Frequency</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "right" }}>Monetary ($)</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>R-F-M Score</th>
                  <th style={{ padding: "10px 12px", color: "#374151", textAlign: "center" }}>RFM Segment</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.slice(0, 50).map(c => (
                  <tr key={c.customer} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{c.customer}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{c.recencyDays}d</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{c.frequency} orders</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>${c.monetary.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, color: "#4B5563" }}>{c.rScore}-{c.fScore}-{c.mScore}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {c.segment === "Champions" && <span style={{ backgroundColor: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🟢 Champion</span>}
                      {c.segment === "Loyal Customers" && <span style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🔵 Loyal</span>}
                      {c.segment === "At Risk" && <span style={{ backgroundColor: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🟡 At Risk</span>}
                      {c.segment === "Lost" && <span style={{ backgroundColor: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🔴 Lost</span>}
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
