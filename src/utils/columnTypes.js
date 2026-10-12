// src/utils/columnTypes.js
/**
 * Canonical Column Type Classification & Data Readiness Engine
 * Standardizes column detection, semantic role mapping, and analytical readiness
 * across Data Quality, Dashboards, Slicers, Copilot, and Lineage.
 */

export function detectColumnType(values = [], colName = "") {
  const nonEmpty = (values || []).filter(v => v !== null && v !== undefined && String(v).trim() !== "");
  if (nonEmpty.length === 0) return "categorical";

  const lowerName = String(colName || "").toLowerCase().trim();

  // 1. Explicit ID / Code Column Name Match (Guards against misinterpreting numeric IDs as metrics)
  if (/(^id$|_id$|uuid|guid|sku|ref|token|hash|number|^aud|account_num|record_num|order_id|customer_id)/i.test(lowerName)) {
    return "id";
  }

  // 2. Explicit Date Column Name Match
  if (/(date|time|created|updated|joined|month|year|timestamp|day|dob|^dt$|period)/i.test(lowerName)) {
    return "date";
  }

  // 3. Strict Value-Based Date Detection
  const sample = nonEmpty.slice(0, 80);
  const dateRegex = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/;
  const dateCount = sample.filter(v => {
    if (v instanceof Date && !isNaN(v.getTime())) return true;
    const str = String(v).trim();
    if (str.length < 6) return false;
    if (dateRegex.test(str)) return true;
    const parsed = Date.parse(str);
    return !isNaN(parsed) && isNaN(Number(str));
  }).length;

  if (dateCount / sample.length > 0.5) {
    return "date";
  }

  // 4. Numeric Detection (only if not date or id)
  const numCount = sample.filter(v => {
    if (typeof v === "number" && !isNaN(v)) return true;
    const str = String(v).trim().replace(/[$€£,]/g, "");
    return str !== "" && !isNaN(Number(str));
  }).length;

  if (numCount / sample.length > 0.75) {
    return "numeric";
  }

  // 5. Categorical Default
  return "categorical";
}

export function getColumnTypeBadge(type = "categorical") {
  switch (type) {
    case "date":
      return { label: "Date / Temporal", icon: "📅", color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD" };
    case "numeric":
      return { label: "Numeric Metric", icon: "🔢", color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0" };
    case "id":
      return { label: "Identifier", icon: "🔑", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" };
    case "categorical":
    default:
      return { label: "Categorical", icon: "🔤", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" };
  }
}

/**
 * Automatically inspects dataset columns and determines semantic role mappings
 */
export function detectColumnMappings(columns = [], rows = []) {
  const sampleRows = rows.slice(0, 50);

  const mappings = {
    date: null,
    revenue: null,
    cost: null,
    profit: null,
    category: null,
    geography: null,
    identifier: null
  };

  columns.forEach(col => {
    const vals = sampleRows.map(r => r[col]);
    const detectedType = detectColumnType(vals, col);
    const lower = col.toLowerCase();

    if (!mappings.date && detectedType === "date") {
      mappings.date = col;
    }
    if (!mappings.revenue && /(sales|revenue|amount|turnover|gmv|price)/i.test(lower) && detectedType === "numeric") {
      mappings.revenue = col;
    }
    if (!mappings.profit && /(profit|margin|earnings|net_income)/i.test(lower) && detectedType === "numeric") {
      mappings.profit = col;
    }
    if (!mappings.cost && /(cost|expense|cogs|spend|discount)/i.test(lower) && detectedType === "numeric") {
      mappings.cost = col;
    }
    if (!mappings.geography && /(region|country|state|city|location|zone|territory)/i.test(lower)) {
      mappings.geography = col;
    }
    if (!mappings.category && /(category|segment|type|department|brand|product)/i.test(lower)) {
      mappings.category = col;
    }
    if (!mappings.identifier && (detectedType === "id" || /(order_id|customer_id|id|code|sku)/i.test(lower))) {
      mappings.identifier = col;
    }
  });

  return mappings;
}

/**
 * Evaluates which analytical features are supported by the dataset
 */
export function assessDataReadiness(columns = [], rows = [], mappings = {}) {
  const map = { ...detectColumnMappings(columns, rows), ...mappings };
  const hasRows = rows.length > 0;

  const checks = [
    {
      id: "time_series",
      title: "Time-Series Trend & Forecasting",
      isReady: hasRows && !!map.date && (!!map.revenue || !!map.profit || columns.some(c => detectColumnType(rows.slice(0, 10).map(r => r[c]), c) === "numeric")),
      readyDetail: `Ready: Using '${map.date}' date dimension with numeric metrics.`,
      missingDetail: "Missing: A date or timestamp column is required to compute historical growth and forecast models."
    },
    {
      id: "profitability",
      title: "Profitability & Margin Analysis",
      isReady: hasRows && !!map.revenue && !!map.profit,
      readyDetail: `Ready: Using '${map.revenue}' (revenue) and '${map.profit}' (profit).`,
      missingDetail: "Missing: Revenue and Profit columns are required to compute net margins."
    },
    {
      id: "geographic",
      title: "Geographic Regional Breakdown",
      isReady: hasRows && !!map.geography,
      readyDetail: `Ready: Using '${map.geography}' dimension.`,
      missingDetail: "Not available: No region, country, state, or location column detected."
    },
    {
      id: "category_breakdown",
      title: "Category & Segment Distribution",
      isReady: hasRows && !!map.category,
      readyDetail: `Ready: Using '${map.category}' dimension.`,
      missingDetail: "Not available: No categorical dimension found for segmentation."
    },
    {
      id: "target_budget",
      title: "Target & Budget Variance Tracking",
      isReady: false,
      readyDetail: "Ready: Budget and target columns configured.",
      missingDetail: "Not available: Target and budget columns required. (Illustrative benchmarks provided in Demo)."
    }
  ];

  return { mappings: map, checks };
}
