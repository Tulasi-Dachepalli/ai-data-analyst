import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as api from "./api";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const COLORS = ["#3E6F8E", "#C98A3E", "#8B6BA8", "#6E8F63", "#B85C5C", "#4C9A9A", "#7A7A7A"];

// ---------------- data helpers ----------------
function detectType(values) {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== "");
  if (nonEmpty.length === 0) return "categorical";
  const sample = nonEmpty.slice(0, 60);
  const numCount = sample.filter(v => v !== "" && !isNaN(Number(v))).length;
  if (numCount / sample.length > 0.8) return "numeric";
  const dateCount = sample.filter(v => !isNaN(Date.parse(v)) && isNaN(Number(v))).length;
  if (dateCount / sample.length > 0.8) return "date";
  return "categorical";
}

function computeColumnStats(rows, col) {
  const values = rows.map(r => r[col]);
  const nonMissing = values.filter(v => v !== null && v !== undefined && String(v).trim() !== "");
  const missing = values.length - nonMissing.length;
  const type = detectType(values);
  const unique = new Set(nonMissing.map(String)).size;
  const base = { name: col, type, count: rows.length, missing, unique };
  if (type === "numeric") {
    const nums = nonMissing.map(Number).filter(n => !isNaN(n));
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = nums.length ? sum / nums.length : 0;
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    return { ...base, sum: +sum.toFixed(2), min: sorted[0], max: sorted[sorted.length - 1], mean: +mean.toFixed(2), median: +median.toFixed(2) };
  }
  if (type === "categorical") {
    const counts = {};
    nonMissing.forEach(v => { const k = String(v); counts[k] = (counts[k] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count }));
    return { ...base, top };
  }
  if (type === "date") {
    const times = nonMissing.map(v => new Date(v).getTime()).filter(t => !isNaN(t));
    return { ...base, min: times.length ? new Date(Math.min(...times)).toISOString().slice(0, 10) : null, max: times.length ? new Date(Math.max(...times)).toISOString().slice(0, 10) : null };
  }
  return base;
}

function calculateDataQuality(rows, columns) {
  const totalCells = rows.length * columns.length;
  let missingCells = 0;
  rows.forEach(row => {
    columns.forEach(col => {
      const v = row[col];
      if (v === null || v === undefined || String(v).trim() === "") missingCells++;
    });
  });
  const missingRate = totalCells ? missingCells / totalCells : 0;
  const score = Math.max(0, Math.round((1 - missingRate) * 100));
  return { score, missingCells, missingRate: +(missingRate * 100).toFixed(2) };
}

function detectOutliers(rows, column) {
  const values = rows.map(r => Number(r[column])).filter(v => !isNaN(v)).sort((a, b) => a - b);
  if (values.length < 4) return { rows: [], lower: null, upper: null };
  const q1 = values[Math.floor(values.length * 0.25)];
  const q3 = values[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const outlierRows = rows.filter(r => {
    const v = Number(r[column]);
    return !isNaN(v) && (v < lower || v > upper);
  });
  return { rows: outlierRows, lower: +lower.toFixed(2), upper: +upper.toFixed(2) };
}

function correlation(rows, colA, colB) {
  const pairs = rows.map(r => [Number(r[colA]), Number(r[colB])]).filter(([a, b]) => !isNaN(a) && !isNaN(b));
  const n = pairs.length;
  if (n < 2) return null;
  const meanA = pairs.reduce((s, p) => s + p[0], 0) / n;
  const meanB = pairs.reduce((s, p) => s + p[1], 0) / n;
  const numerator = pairs.reduce((s, [a, b]) => s + (a - meanA) * (b - meanB), 0);
  const denominator = Math.sqrt(
    pairs.reduce((s, [a]) => s + Math.pow(a - meanA, 2), 0) *
    pairs.reduce((s, [, b]) => s + Math.pow(b - meanB, 2), 0)
  );
  return denominator ? +(numerator / denominator).toFixed(3) : 0;
}

function correlationLabel(r) {
  const abs = Math.abs(r);
  const dir = r >= 0 ? "positive" : "negative";
  if (abs >= 0.8) return `Strong ${dir}`;
  if (abs >= 0.5) return `Moderate ${dir}`;
  return "Weak";
}

function chooseChart(type, uniqueCount) {
  if (type === "date") return "line";
  if (type === "categorical" && uniqueCount <= 6) return "pie";
  if (type === "numeric") return "histogram";
  return "bar";
}

function buildHistogram(rows, column, bucketCount) {
  const values = rows.map(r => Number(r[column])).filter(v => !isNaN(v));
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ group: String(min), value: values.length }];
  const buckets = bucketCount || 8;
  const width = (max - min) / buckets;
  const counts = Array(buckets).fill(0);
  values.forEach(v => {
    let idx = Math.floor((v - min) / width);
    if (idx >= buckets) idx = buckets - 1;
    counts[idx]++;
  });
  return counts.map((count, i) => ({
    group: `${(min + i * width).toFixed(1)}–${(min + (i + 1) * width).toFixed(1)}`,
    value: count
  }));
}

function computeAggregate(rows, groupBy, metric, agg) {
  const map = {};
  rows.forEach(r => {
    const g = r[groupBy] === null || r[groupBy] === undefined || r[groupBy] === "" ? "(blank)" : String(r[groupBy]);
    const raw = metric ? Number(r[metric]) : 1;
    if (!map[g]) map[g] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    if (metric && !isNaN(raw)) {
      map[g].sum += raw; map[g].count += 1;
      map[g].min = Math.min(map[g].min, raw); map[g].max = Math.max(map[g].max, raw);
    } else if (!metric) {
      map[g].count += 1;
    }
  });
  const rowsOut = Object.entries(map).map(([group, a]) => {
    let value;
    switch (agg) {
      case "avg": value = a.count ? a.sum / a.count : 0; break;
      case "count": value = a.count; break;
      case "min": value = a.min === Infinity ? 0 : a.min; break;
      case "max": value = a.max === -Infinity ? 0 : a.max; break;
      default: value = a.sum;
    }
    return { group, value: +value.toFixed(2) };
  });
  return rowsOut.sort((a, b) => b.value - a.value).slice(0, 15);
}

function computeTrend(rows, dateCol, metricCol, agg) {
  const map = {};
  rows.forEach(r => {
    const d = new Date(r[dateCol]);
    if (isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    const raw = metricCol ? Number(r[metricCol]) : 1;
    if (!map[key]) map[key] = { sum: 0, count: 0 };
    if (!metricCol) { map[key].count += 1; }
    else if (!isNaN(raw)) { map[key].sum += raw; map[key].count += 1; }
  });
  return Object.entries(map)
    .map(([group, a]) => ({ group, value: +(agg === "avg" ? (a.count ? a.sum / a.count : 0) : (agg === "count" ? a.count : a.sum)).toFixed(2) }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

function pickDashboardPlan(stats) {
  const numeric = stats.filter(s => s.type === "numeric");
  const categorical = stats.filter(s => s.type === "categorical" && s.unique > 1 && s.unique <= 30);
  const dateCols = stats.filter(s => s.type === "date");
  const kpiCols = numeric.slice(0, 4);
  const categoryCols = categorical.slice(0, 2);
  const trendPlan = dateCols.length && numeric.length ? { dateCol: dateCols[0].name, metricCol: numeric[0].name } : null;
  const distributionCols = numeric.slice(0, 2);
  const outlierCols = numeric.slice(0, 4);
  const correlationPairs = [];
  for (let i = 0; i < numeric.length && correlationPairs.length < 3; i++) {
    for (let j = i + 1; j < numeric.length && correlationPairs.length < 3; j++) {
      correlationPairs.push([numeric[i].name, numeric[j].name]);
    }
  }
  return { kpiCols, categoryCols, trendPlan, distributionCols, outlierCols, correlationPairs };
}

async function callClaude(system, userText, { requestType, datasetId } = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const token = localStorage.getItem("aida_token");
  const res = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ system, userText, requestType, datasetId })
  });
  if (res.status === 401) {
    // Session expired or invalid — send back to the login screen.
    localStorage.removeItem("aida_token");
    localStorage.removeItem("aida_user");
    window.location.reload();
    return "";
  }
  if (!res.ok) {
    console.error("Backend error:", res.status, await res.text().catch(() => ""));
    return "";
  }
  const data = await res.json();
  return data.text || "";
}

function parseJSONSafe(text) {
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) { return null; }
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv" || ext === "tsv") {
      Papa.parse(file, {
        header: true, dynamicTyping: true, skipEmptyLines: true,
        complete: (res) => resolve({ rows: res.data, columns: res.meta.fields || [] }),
        error: reject
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "binary" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          const columns = rows.length ? Object.keys(rows[0]) : [];
          resolve({ rows, columns });
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    }
  });
}

// ---------------- UI bits ----------------
function ChartBlock({ chartType, data, metricLabel, height }) {
  if (!data || data.length === 0) return null;
  const h = height || 210;
  if (chartType === "pie" && data.length <= 8) {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="group" cx="50%" cy="50%" outerRadius={75} label={(d) => d.group}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
          <XAxis dataKey="group" tick={{ fontSize: 10.5, fill: "#8A8580" }} />
          <YAxis tick={{ fontSize: 10.5, fill: "#8A8580" }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3E6F8E" strokeWidth={2} dot={{ r: 3 }} name={metricLabel} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
        <XAxis dataKey="group" tick={{ fontSize: 10.5, fill: "#8A8580" }} interval={0} angle={-20} textAnchor="end" height={44} />
        <YAxis tick={{ fontSize: 10.5, fill: "#8A8580" }} />
        <Tooltip />
        <Bar dataKey="value" fill="#3E6F8E" name={metricLabel} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "6px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#B7B2A9", animation: `bounce 1.2s ${i * 0.15}s infinite ease-in-out` }} />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100% { opacity:.3; transform:translateY(0);} 40% { opacity:1; transform:translateY(-3px);} }`}</style>
    </div>
  );
}

const FileChip = ({ name, rows, cols }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EDEAE3", border: "1px solid #DDD8CE", borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}>
    <div style={{ width: 26, height: 26, borderRadius: 6, background: "#3E6F8E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
      {name.split(".").pop().slice(0, 3).toUpperCase()}
    </div>
    <div>
      <div style={{ fontWeight: 600, color: "#2B2A27" }}>{name}</div>
      <div style={{ color: "#8A8580", fontSize: 11 }}>{rows.toLocaleString()} rows · {cols} cols</div>
    </div>
  </div>
);

function KpiCard({ label, value }) {
  return (
    <div style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: "10px 14px", minWidth: 110 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', Consolas, monospace", fontSize: 18, fontWeight: 600, color: "#2B2A27" }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A8580", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function QualityCard({ quality }) {
  if (!quality) return null;
  const color = quality.score >= 90 ? "#6E8F63" : quality.score >= 70 ? "#C98A3E" : "#B85C5C";
  return (
    <div style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: "10px 14px", minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', Consolas, monospace", fontSize: 18, fontWeight: 600, color }}>{quality.score}%</div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A8580" }}>Data Quality</div>
      </div>
      <div style={{ fontSize: 11, color: "#8A8580", marginTop: 2 }}>{quality.missingCells.toLocaleString()} missing cells ({quality.missingRate}%)</div>
    </div>
  );
}

function OutlierBlock({ outliers }) {
  const entries = Object.entries(outliers || {}).filter(([, o]) => o.rows.length > 0);
  if (entries.length === 0) return null;
  return (
    <div style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 6 }}>⚠ Outlier Detection</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map(([col, o]) => (
          <div key={col} style={{ fontSize: 12.5, color: "#2B2A27" }}>
            <strong>{col}</strong>: {o.rows.length} unusual value{o.rows.length === 1 ? "" : "s"} outside {o.lower}–{o.upper}
          </div>
        ))}
      </div>
    </div>
  );
}

function CorrelationBlock({ correlations }) {
  if (!correlations || correlations.length === 0) return null;
  return (
    <div style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 6 }}>Correlation Analysis</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {correlations.map((c, i) => (
          <div key={i} style={{ fontSize: 12.5, color: "#2B2A27" }}>
            <strong>{c.colA}</strong> vs <strong>{c.colB}</strong>: {c.r} ({correlationLabel(c.r)})
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardBlock({ dashboard, innerRef }) {
  return (
    <div ref={innerRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#2B2A27" }}>📊 Dashboard</div>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "#2B2A27" }}>{dashboard.narrative}</div>
      {(dashboard.kpis.length > 0 || dashboard.quality) && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QualityCard quality={dashboard.quality} />
          {dashboard.kpis.map((k, i) => <KpiCard key={i} label={k.label} value={k.value} />)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: dashboard.categoryCharts.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
        {dashboard.categoryCharts.map((c, i) => (
          <div key={i} style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 4 }}>{c.title}</div>
            <ChartBlock chartType={c.chartType || "bar"} data={c.data} metricLabel={c.metricLabel} />
          </div>
        ))}
      </div>
      {dashboard.trend && (
        <div style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 4 }}>{dashboard.trend.title}</div>
          <ChartBlock chartType="line" data={dashboard.trend.data} metricLabel={dashboard.trend.metricLabel} height={200} />
        </div>
      )}
      {dashboard.distributions && dashboard.distributions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: dashboard.distributions.length > 1 ? "1fr 1fr" : "1fr", gap: 12 }}>
          {dashboard.distributions.map((d, i) => (
            <div key={i} style={{ background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#5C584F", marginBottom: 4 }}>{d.title}</div>
              <ChartBlock chartType="histogram" data={d.data} metricLabel={d.metricLabel} />
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: dashboard.correlations && dashboard.correlations.length ? "1fr 1fr" : "1fr", gap: 12 }}>
        <OutlierBlock outliers={dashboard.outliers} />
        <CorrelationBlock correlations={dashboard.correlations} />
      </div>
    </div>
  );
}

// ---------------- main component ----------------
export default function DataAnalystDashboardBot() {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Analyzing…");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const dashboardRefs = useRef({});

  const active = threads.find(t => t.id === activeId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active && active.messages.length, loading]);

  // Load this company's previously saved datasets (metadata only — full rows
  // load lazily when the user opens one) so people can pick up where they left off.
  useEffect(() => {
    api.listDatasets()
      .then((res) => {
        if (!res || !res.datasets) return;
        setThreads(prev => {
          const known = new Set(prev.filter(t => t.serverId).map(t => t.serverId));
          const stubs = res.datasets
            .filter(d => !known.has(d.id))
            .map(d => ({
              id: `srv-${d.id}`,
              serverId: d.id,
              name: d.name,
              rows: null, columns: null, stats: null,
              quality: d.qualityScore != null ? { score: d.qualityScore, missingCells: 0, missingRate: 0 } : null,
              dashboard: null,
              messages: [],
              loaded: false,
              rowCountHint: d.rowCount,
              colCountHint: d.columnCount
            }));
          return [...prev, ...stubs];
        });
      })
      .catch(err => console.error("Failed to load saved datasets:", err));
  }, []);

  const updateThread = (id, updater) => setThreads(prev => prev.map(t => t.id === id ? updater(t) : t));

  // Fire-and-forget save of dashboard/messages for a persisted dataset. Failures
  // are logged, not surfaced — losing a save shouldn't interrupt someone's chat.
  const persistThread = (serverId, payload) => {
    if (!serverId) return;
    api.updateDataset(serverId, payload).catch(err => console.error("Failed to save analysis:", err));
  };

  const buildDashboard = async (id, stats, rows, quality, serverId) => {
    const plan = pickDashboardPlan(stats);
    const kpis = plan.kpiCols.map(c => ({ label: `Avg ${c.name}`, value: c.mean.toLocaleString() }));
    const categoryCharts = plan.categoryCols.map(c => ({
      title: `Count by ${c.name}`,
      metricLabel: "count",
      chartType: chooseChart(c.type, c.unique),
      data: computeAggregate(rows, c.name, null, "count")
    }));
    let trend = null;
    if (plan.trendPlan) {
      const data = computeTrend(rows, plan.trendPlan.dateCol, plan.trendPlan.metricCol, "sum");
      if (data.length > 1) trend = { title: `${plan.trendPlan.metricCol} over time`, metricLabel: plan.trendPlan.metricCol, data };
    }

    const distributions = plan.distributionCols.map(c => ({
      title: `Distribution of ${c.name}`,
      metricLabel: c.name,
      data: buildHistogram(rows, c.name, 8)
    }));

    const outliers = {};
    plan.outlierCols.forEach(c => { outliers[c.name] = detectOutliers(rows, c.name); });

    const correlations = plan.correlationPairs
      .map(([colA, colB]) => ({ colA, colB, r: correlation(rows, colA, colB) }))
      .filter(c => c.r !== null && Math.abs(c.r) >= 0.5);

    const narrateSystem = "You are a data analyst producing a short executive dashboard summary. Given verified computed aggregates (trust these exactly, never invent numbers), write 4-6 sentences covering the key patterns: notable KPI values, differences across the category breakdowns, the trend over time if present, and anything noteworthy from data quality, outliers, or correlations. Plain conversational text, no markdown headers, no JSON.";
    const narrateUser = JSON.stringify({ rowCount: rows.length, kpis, categoryCharts, trend, quality, outlierSummary: Object.entries(outliers).map(([k, o]) => ({ column: k, count: o.rows.length })), correlations });
    const narrative = await callClaude(narrateSystem, narrateUser, { requestType: "dashboard_narrative", datasetId: serverId });

    const dashboardObj = { kpis, categoryCharts, trend, distributions, quality, outliers, correlations, narrative: narrative || "Here's an overview of your data." };
    let finalMessages = null;
    updateThread(id, t => {
      finalMessages = [...t.messages, { role: "assistant", kind: "dashboard" }];
      return { ...t, dashboard: dashboardObj, messages: finalMessages };
    });
    setLoading(false);
    persistThread(serverId, { dashboard: dashboardObj, messages: finalMessages });
  };

  const generateOverview = async (id, stats, rowCount, rows, quality, serverId) => {
    setLoadingLabel("Reading your data…");
    const system = "You are a data analyst chatbot. Given a dataset's schema, verified summary statistics, and a computed data quality score (trust these exactly, never invent numbers), write a short friendly overview: 2-3 sentences on what the dataset contains and any data quality issues (missing values etc). Plain conversational text, no markdown headers, no JSON.";
    const userText = JSON.stringify({ columns: stats, rowCount, quality });
    const text = await callClaude(system, userText, { requestType: "overview", datasetId: serverId });
    updateThread(id, t => ({ ...t, messages: [...t.messages, { role: "assistant", kind: "text", content: text || "Here's your data." }] }));
    setLoadingLabel("Building your dashboard…");
    await buildDashboard(id, stats, rows, quality, serverId);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList);
    for (const file of files) {
      try {
        const { rows, columns } = await parseFile(file);
        const cleanCols = columns.filter(c => c && c.trim() !== "");
        const stats = cleanCols.map(c => computeColumnStats(rows, c));
        const quality = calculateDataQuality(rows, cleanCols);
        const id = Date.now() + "-" + file.name;
        const initialMessages = [{ role: "user", kind: "file", fileName: file.name, rowCount: rows.length, colCount: cleanCols.length }];
        const thread = {
          id, name: file.name, rows, columns: cleanCols, stats, quality, dashboard: null,
          messages: initialMessages, loaded: true, serverId: null
        };
        setThreads(prev => [thread, ...prev]);
        setActiveId(id);
        setLoading(true);

        let serverId = null;
        try {
          const created = await api.createDataset({ name: file.name, rows, columns: cleanCols, stats, quality, messages: initialMessages });
          serverId = created?.dataset?.id || null;
          if (serverId) updateThread(id, t => ({ ...t, serverId }));
        } catch (err) {
          console.error("Failed to save dataset — continuing without persistence:", err);
        }

        generateOverview(id, stats, rows.length, rows, quality, serverId);
      } catch (err) { console.error(err); }
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || !active || !active.rows) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const id = active.id;
    const serverId = active.serverId;
    updateThread(id, t => ({ ...t, messages: [...t.messages, { role: "user", kind: "text", content: question }] }));
    setLoading(true);
    setLoadingLabel("Analyzing…");

    try {
      const recentHistory = active.messages.filter(m => m.kind === "text").slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
      const planSystem = "You are a rigorous data analyst assistant in an ongoing chat. You are given a dataset's schema and verified summary statistics (already computed accurately from the FULL dataset — trust these numbers exactly, never invent your own), plus recent conversation history for follow-ups. Respond with ONLY a single JSON object, no markdown fences: {\"mode\":\"direct\"|\"aggregate\",\"directAnswer\":string|null,\"groupBy\":string|null,\"metric\":string|null,\"agg\":\"sum\"|\"avg\"|\"count\"|\"min\"|\"max\"|null,\"chartType\":\"bar\"|\"line\"|\"pie\"|\"none\"}. Use 'direct' with directAnswer when the stats already answer it. Use 'aggregate' when it needs grouping — groupBy/metric must be exact column names.";
      const planUser = JSON.stringify({ question, conversationHistory: recentHistory, rowCount: active.rows.length, columns: active.stats, sampleRows: active.rows.slice(0, 5) });
      const planText = await callClaude(planSystem, planUser, { requestType: "chat_plan", datasetId: serverId });
      const plan = parseJSONSafe(planText);

      let finalMessages = null;
      if (!plan) {
        updateThread(id, t => {
          finalMessages = [...t.messages, { role: "assistant", kind: "text", content: "I couldn't quite work that out — could you rephrase?" }];
          return { ...t, messages: finalMessages };
        });
        setLoading(false);
        persistThread(serverId, { messages: finalMessages });
        return;
      }
      if (plan.mode === "direct") {
        updateThread(id, t => {
          finalMessages = [...t.messages, { role: "assistant", kind: "text", content: plan.directAnswer || "I don't have enough in this data to answer that." }];
          return { ...t, messages: finalMessages };
        });
      } else {
        const result = computeAggregate(active.rows, plan.groupBy, plan.metric, plan.agg || "sum");
        const narrateSystem = "You are a data analyst chatbot writing a short conversational answer, given the user's question and an already-computed verified aggregation result (trust exactly). Write 3-6 sentences or a short bullet list referencing specific values. No JSON, no markdown headers.";
        const narrateUser = JSON.stringify({ question, groupBy: plan.groupBy, metric: plan.metric, agg: plan.agg, result });
        const narrative = await callClaude(narrateSystem, narrateUser, { requestType: "chat_narrative", datasetId: serverId });
        updateThread(id, t => {
          finalMessages = [...t.messages, { role: "assistant", kind: "text+chart", content: narrative || "Here's what the data shows:", chart: { type: plan.chartType === "none" ? "bar" : plan.chartType, data: result, metricLabel: plan.metric || "count" } }];
          return { ...t, messages: finalMessages };
        });
      }
      persistThread(serverId, { messages: finalMessages });
    } catch (err) {
      let finalMessages = null;
      updateThread(id, t => {
        finalMessages = [...t.messages, { role: "assistant", kind: "text", content: "Something went wrong on my end — mind trying again?" }];
        return { ...t, messages: finalMessages };
      });
      persistThread(serverId, { messages: finalMessages });
    }
    setLoading(false);
  };

  // Clicking a saved-but-not-yet-loaded dataset fetches its full rows/dashboard/
  // messages from the backend on demand, instead of loading everything up front.
  const handleSelectThread = async (t) => {
    setActiveId(t.id);
    if (t.loaded || !t.serverId) return;
    setLoading(true);
    setLoadingLabel("Loading previous analysis…");
    try {
      const res = await api.getDataset(t.serverId);
      const d = res.dataset;
      updateThread(t.id, prev => ({
        ...prev,
        rows: d.rows,
        columns: d.columns,
        stats: d.stats,
        quality: d.quality,
        dashboard: d.dashboard,
        messages: d.messages && d.messages.length
          ? d.messages
          : [{ role: "user", kind: "file", fileName: prev.name, rowCount: d.rows.length, colCount: d.columns.length }],
        loaded: true
      }));
    } catch (err) {
      console.error("Failed to load saved dataset:", err);
    }
    setLoading(false);
  };

  const handleDeleteThread = async (t, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    if (t.serverId) {
      try {
        await api.deleteDataset(t.serverId);
      } catch (err) {
        console.error("Failed to delete dataset:", err);
        return;
      }
    }
    setThreads(prev => prev.filter(x => x.id !== t.id));
    if (activeId === t.id) setActiveId(null);
  };

  const handleDownloadExcel = (thread) => {
    if (!thread || !thread.dashboard) return;
    const workbook = XLSX.utils.book_new();

    const summary = [
      ["AI DATA ANALYSIS REPORT"],
      ["Dataset", thread.name],
      ["Rows", thread.rows.length],
      ["Columns", thread.columns.length],
      ["Data Quality Score", thread.quality ? `${thread.quality.score}%` : ""],
      [],
      ["KEY INSIGHTS"],
      [thread.dashboard.narrative || ""]
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), "Executive Summary");

    const statsRows = thread.stats.map(s => ({
      column: s.name, type: s.type, missing: s.missing, unique: s.unique,
      mean: s.mean ?? "", median: s.median ?? "", min: s.min ?? "", max: s.max ?? ""
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statsRows), "Statistics");

    const outlierRows = [];
    Object.entries(thread.dashboard.outliers || {}).forEach(([col, o]) => {
      o.rows.forEach(r => outlierRows.push({ column: col, ...r }));
    });
    if (outlierRows.length) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(outlierRows), "Outliers");

    if (thread.dashboard.correlations && thread.dashboard.correlations.length) {
      const corrRows = thread.dashboard.correlations.map(c => ({ column_a: c.colA, column_b: c.colB, correlation: c.r, strength: correlationLabel(c.r) }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(corrRows), "Correlations");
    }

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(thread.rows), "Raw Data");

    XLSX.writeFile(workbook, thread.name.replace(/\.[^.]+$/, "") + "-analysis-report.xlsx");
  };

  const handleDownloadReport = (thread) => {
    if (!thread || !thread.dashboard) return;
    const node = dashboardRefs.current[thread.id];
    const chartsHTML = node ? node.innerHTML : "<p>No charts available.</p>";
    const sampleRows = thread.rows.slice(0, 10);
    const tableHead = thread.columns.map(c => `<th>${c}</th>`).join("");
    const tableBody = sampleRows.map(r => `<tr>${thread.columns.map(c => `<td>${r[c] ?? ""}</td>`).join("")}</tr>`).join("");
    const generatedDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${thread.name} — Data Analysis Report</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2B2A27;max-width:820px;margin:40px auto;padding:0 24px;line-height:1.6;}
h1{font-size:22px;margin-bottom:2px;} .meta{color:#8A8580;font-size:13px;margin-bottom:28px;}
h2{font-size:15px;border-bottom:1px solid #EAE7E0;padding-bottom:6px;margin-top:32px;}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin-top:10px;}
th,td{border:1px solid #EAE7E0;padding:6px 8px;text-align:left;}
th{background:#F7F5F0;} p{font-size:13.5px;}
@media print{body{margin:0;padding:16px;}}
</style></head><body>
<h1>Data Analysis Report</h1>
<div class="meta">Dataset: ${thread.name} · ${thread.rows.length.toLocaleString()} rows · ${thread.columns.length} columns · Generated ${generatedDate}</div>
<h2>Summary</h2>
<p>${(thread.dashboard.narrative || "").replace(/\n/g, "<br/>")}</p>
<h2>Dashboard</h2>
${chartsHTML}
<h2>Data Sample (first 10 rows)</h2>
<table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>
<p style="margin-top:24px;color:#8A8580;font-size:11.5px;">Open this file in a browser and use Print → Save as PDF to share as a PDF.</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = thread.name.replace(/\.[^.]+$/, "") + "-report.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const autoGrow = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div style={{ display: "flex", height: 600, borderRadius: 10, overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", border: "1px solid #E4E0D8", background: "#FFFFFF" }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
    >
      <div style={{ width: 220, background: "#F7F5F0", borderRight: "1px solid #E4E0D8", display: "flex", flexDirection: "column", padding: 12, gap: 10 }}>
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#2B2A27", color: "#fff", border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> New analysis
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,.tsv,.xlsx,.xls" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A6A196", marginTop: 6, padding: "0 4px" }}>Datasets</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          {threads.length === 0 && <div style={{ fontSize: 11.5, color: "#A6A196", padding: "6px 4px" }}>No files yet</div>}
          {threads.map(t => (
            <div key={t.id} onClick={() => handleSelectThread(t)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, background: t.id === activeId ? "#EDEAE3" : "transparent", color: "#2B2A27" }}>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: t.loaded ? 1 : 0.6 }}>{t.name}</span>
              <button onClick={(e) => handleDeleteThread(t, e)} title="Delete dataset"
                style={{ flexShrink: 0, background: "none", border: "none", color: "#A6A196", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", background: dragOver ? "#F7F5F0" : "#fff" }}>
        {dragOver && (
          <div style={{ position: "absolute", inset: 8, border: "2px dashed #3E6F8E", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#3E6F8E", background: "rgba(255,255,255,0.85)", zIndex: 5, fontWeight: 600 }}>
            Drop file to analyze
          </div>
        )}

        {active && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px 0" }}>
            <button onClick={() => handleDownloadExcel(active)} disabled={!active.dashboard}
              style={{ fontSize: 12, fontWeight: 600, color: active.dashboard ? "#2B2A27" : "#C7C2B8", background: "#F7F5F0", border: "1px solid #E4E0D8", borderRadius: 7, padding: "7px 12px", cursor: active.dashboard ? "pointer" : "default" }}>
              ⬇ Excel Report
            </button>
            <button onClick={() => handleDownloadReport(active)} disabled={!active.dashboard}
              style={{ fontSize: 12, fontWeight: 600, color: active.dashboard ? "#2B2A27" : "#C7C2B8", background: "#F7F5F0", border: "1px solid #E4E0D8", borderRadius: 7, padding: "7px 12px", cursor: active.dashboard ? "pointer" : "default" }}>
              ⬇ HTML Report
            </button>
          </div>
        )}

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 0 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 18 }}>
            {!active && (
              <div style={{ textAlign: "center", color: "#A6A196", fontSize: 13.5, marginTop: 100, lineHeight: 1.7 }}>
                <div style={{ fontSize: 17, color: "#2B2A27", fontWeight: 600, marginBottom: 6 }}>Data Analyst</div>
                Upload a CSV or Excel file — I'll build a dashboard and you can ask follow-up questions.
              </div>
            )}
            {active && active.messages.map((m, i) => {
              if (m.kind === "file") return <div key={i} style={{ alignSelf: "flex-end" }}><FileChip name={m.fileName} rows={m.rowCount} cols={m.colCount} /></div>;
              if (m.kind === "dashboard") return (
                <div key={i} style={{ alignSelf: "stretch", background: "#FDFCFA", border: "1px solid #EAE7E0", borderRadius: 10, padding: 16 }}>
                  <DashboardBlock dashboard={active.dashboard} innerRef={el => { if (el) dashboardRefs.current[active.id] = el; }} />
                </div>
              );
              if (m.role === "user") return (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "80%", background: "#F0EEE9", color: "#2B2A27", borderRadius: "14px 14px 3px 14px", padding: "10px 15px", fontSize: 14, lineHeight: 1.55 }}>{m.content}</div>
              );
              return (
                <div key={i} style={{ alignSelf: "flex-start", maxWidth: "92%", fontSize: 14, lineHeight: 1.65, color: "#2B2A27" }}>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                  {m.kind === "text+chart" && (
                    <div style={{ marginTop: 10, background: "#FBFAF7", border: "1px solid #EAE7E0", borderRadius: 8, padding: 10 }}>
                      <ChartBlock chartType={m.chart.type} data={m.chart.data} metricLabel={m.chart.metricLabel} />
                    </div>
                  )}
                </div>
              );
            })}
            {loading && <div style={{ alignSelf: "flex-start" }}><div style={{ fontSize: 11.5, color: "#A6A196", marginBottom: 2 }}>{loadingLabel}</div><TypingDots /></div>}
          </div>
        </div>

        <div style={{ padding: "10px 20px 20px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#F7F5F0", border: "1px solid #E4E0D8", borderRadius: 16, padding: "8px 8px 8px 14px" }}>
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Attach a file"
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #DDD8CE", background: "#fff", color: "#8A8580", fontSize: 16, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 2 }}>+</button>
              <textarea ref={textareaRef} value={input} onChange={(e) => { setInput(e.target.value); autoGrow(e); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={active ? "Ask about your data…" : "Upload a file to begin, then ask away…"} rows={1}
                style={{ flex: 1, resize: "none", border: "none", outline: "none", background: "transparent", fontSize: 14, lineHeight: 1.5, padding: "6px 0", fontFamily: "inherit", maxHeight: 140 }} />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: (loading || !input.trim()) ? "#DDD8CE" : "#2B2A27", color: "#fff", cursor: (loading || !input.trim()) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginBottom: 2 }}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
