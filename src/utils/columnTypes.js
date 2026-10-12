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
 * Automatically inspects dataset columns and determines semantic role mappings.
 * Strictly excludes discount percentages or rates from operating cost.
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
    // Genuine operating expense / cost detection:
    // Strictly excludes discount, rate, pct, margin, or fractional values between 0 and 1
    if (!mappings.cost && /(^cost$|_cost$|expense|cogs|spend|operating_cost|expenditure)/i.test(lower) && !/(discount|rate|pct|percent|margin|profit)/i.test(lower) && detectedType === "numeric") {
      const nums = sampleRows.map(r => parseFloat(r[col])).filter(n => !isNaN(n));
      const isFractionalRate = nums.length > 0 && nums.every(n => n >= 0 && n <= 1);
      if (!isFractionalRate) {
        mappings.cost = col;
      }
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
 * Validates a selected column mapping against semantic role rules
 */
export function validateColumnMapping(colName, role, rows = []) {
  if (!colName || colName === "" || colName === "none") {
    return {
      isValid: true,
      status: "not_available",
      statusLabel: "Not available",
      message: "Not mapped in active schema. Features requiring this dimension will be safely omitted."
    };
  }

  const sampleRows = rows.slice(0, 50);
  const sampleValues = sampleRows.map(r => r[colName]);
  const detectedType = detectColumnType(sampleValues, colName);
  const missingCount = sampleValues.filter(v => v === null || v === undefined || String(v).trim() === "").length;
  const missingPct = Math.round((missingCount / Math.max(1, sampleValues.length)) * 100);

  const numVals = sampleValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
  const minVal = numVals.length > 0 ? Math.min(...numVals) : 0;
  const maxVal = numVals.length > 0 ? Math.max(...numVals) : 0;
  const isFractionalRate = numVals.length > 0 && minVal >= 0 && maxVal <= 1;

  if (role === "cost") {
    if (/discount|rate|pct|percent/i.test(colName) || isFractionalRate) {
      return {
        isValid: false,
        status: "warning",
        statusLabel: "Semantic Mismatch",
        message: `Warning: '${colName}' appears to be a discount rate or percentage (${minVal} - ${maxVal}), not an operating cost. A discount is not an expense.`
      };
    }
    if (detectedType !== "numeric") {
      return {
        isValid: false,
        status: "error",
        statusLabel: "Type Error",
        message: `Error: '${colName}' is not numeric. Operating cost requires currency numbers.`
      };
    }
  }

  if (role === "revenue" || role === "profit") {
    if (detectedType !== "numeric") {
      return {
        isValid: false,
        status: "error",
        statusLabel: "Type Error",
        message: `Error: '${colName}' is not numeric. Currency metrics must be numeric.`
      };
    }
  }

  if (role === "date" && detectedType !== "date") {
    return {
      isValid: false,
      status: "warning",
      statusLabel: "Date Format",
      message: `Warning: '${colName}' contains values that could not be verified as dates.`
    };
  }

  return {
    isValid: true,
    status: "valid",
    statusLabel: "Valid Mapping",
    message: `Verified: ${detectedType === "date" ? "Date dimension" : detectedType === "numeric" ? "Numeric metric" : "Categorical dimension"} (${100 - missingPct}% completeness).`
  };
}

/**
 * Evaluates dataset analytical feasibility with clear eligibility explanations:
 * - "Available" (Green)
 * - "Needs more data" (Amber)
 * - "Missing required columns" (Red / Neutral)
 * Separates historical trend charts from statistical predictive forecasting.
 */
export function assessDataReadiness(columns = [], rows = [], mappings = {}) {
  const map = { ...detectColumnMappings(columns, rows), ...mappings };
  const hasRows = rows.length > 0;
  const rowCount = rows.length;

  const checks = [
    {
      id: "historical_trends",
      title: "Time-Series Historical Trend Charts",
      category: "Trend Analysis",
      status: (!hasRows || !map.date)
        ? "missing_columns"
        : rowCount < 2
          ? "needs_more_data"
          : "available",
      statusLabel: (!hasRows || !map.date)
        ? "Missing required columns"
        : rowCount < 2
          ? "Needs more data"
          : "Available",
      isReady: hasRows && !!map.date && rowCount >= 2,
      readyDetail: `Available: Historical trend lines can plot movements across ${rowCount} chronological records on '${map.date}'.`,
      missingDetail: (!hasRows || !map.date)
        ? "Missing required columns: Requires a date column and at least one numeric metric."
        : `Needs more data: At least 2 chronological observations are required (currently ${rowCount}).`
    },
    {
      id: "time_series", // Retained for backwards compatibility with tests
      title: "Time-Series Trend & Forecasting",
      category: "Forecasting",
      status: (!hasRows || !map.date)
        ? "missing_columns"
        : rowCount < 30
          ? "needs_more_data"
          : "available",
      statusLabel: (!hasRows || !map.date)
        ? "Missing required columns"
        : rowCount < 30
          ? "Needs more data"
          : "Available",
      isReady: hasRows && !!map.date && rowCount >= 30,
      readyDetail: `Available: ${rowCount} observations provide sufficient history for forward projection models.`,
      missingDetail: (!hasRows || !map.date)
        ? "Missing required columns: Requires a date column and metric for projections."
        : `Needs more data: Only ${rowCount} irregular transaction records detected. Reliable statistical forecasting (ARIMA / Holt-Winters) requires at least 30 continuous periodic records without large time gaps. Historical trend charts remain available.`
    },
    {
      id: "profitability",
      title: "Profitability & Margin Analysis",
      category: "Margin Analysis",
      status: (hasRows && map.revenue && map.profit)
        ? "available"
        : "missing_columns",
      statusLabel: (hasRows && map.revenue && map.profit)
        ? "Available"
        : "Missing required columns",
      isReady: hasRows && !!map.revenue && !!map.profit,
      readyDetail: `Available: Using '${map.revenue}' (revenue) and '${map.profit}' (profit).`,
      missingDetail: "Missing required columns: Both Revenue and Profit columns are required to compute net margins."
    },
    {
      id: "cost_analysis",
      title: "Operating Cost & Spend Analysis",
      category: "Expense Analysis",
      status: (hasRows && map.cost)
        ? "available"
        : "missing_columns",
      statusLabel: (hasRows && map.cost)
        ? "Available"
        : "Missing required columns",
      isReady: hasRows && !!map.cost,
      readyDetail: `Available: Using verified expense column '${map.cost}'.`,
      missingDetail: "Missing required columns: No operating cost or expense column detected. (Discount rates are excluded from expense analysis)."
    },
    {
      id: "geographic",
      title: "Geographic Regional Breakdown",
      category: "Segmentation",
      status: (hasRows && map.geography)
        ? "available"
        : "missing_columns",
      statusLabel: (hasRows && map.geography)
        ? "Available"
        : "Missing required columns",
      isReady: hasRows && !!map.geography,
      readyDetail: `Available: Using '${map.geography}' dimension.`,
      missingDetail: "Missing required columns: No region, country, state, or location column detected."
    },
    {
      id: "target_budget",
      title: "Target & Budget Variance Tracking",
      category: "Governance & Planning",
      status: "missing_columns",
      statusLabel: "Missing required columns",
      isReady: false,
      readyDetail: "Available: Target and budget columns configured.",
      missingDetail: "Missing required columns: Target and budget columns not present in active dataset. (Illustrative benchmarks provided in Demo Examples)."
    }
  ];

  return { mappings: map, checks };
}
