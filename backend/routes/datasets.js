import { Router } from "express";
import multer from "multer";
import pool, { logAction } from "../db.js";
import { requireTokenQuota } from "../middleware/auth.js";
import { recordUsage } from "../lib/quota.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const MAX_JSON_LENGTH = 12 * 1024 * 1024; // ~12MB of serialized rows/columns/stats
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

function cleanErrorText(raw) {
  if (!raw || typeof raw !== "string") return "Service temporarily unavailable.";
  const trimmed = raw.trim();
  if (trimmed.startsWith("<") || trimmed.includes("<!DOCTYPE") || trimmed.includes("<html") || trimmed.includes("502")) {
    return "Analysis engine service is warming up or temporarily unavailable.";
  }
  return trimmed.replace(/<[^>]*>/g, "").slice(0, 300);
}

function toListItem(row) {
  return {
    id: row.id,
    name: row.name,
    rowCount: row.row_count,
    columnCount: row.column_count,
    qualityScore: row.quality_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toFullItem(row) {
  // Postgres hands JSONB columns back already parsed into JS values.
  const data = row.data_json || {};
  return {
    id: row.id,
    name: row.name,
    rows: data.rows || [],
    columns: data.columns || [],
    stats: data.stats || [],
    quality: data.quality || null,
    isRawText: data.isRawText || false,
    rawText: data.rawText || "",
    dashboard: row.dashboard_json || null,
    messages: row.messages_json || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const originalFetch = globalThis.fetch;

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await originalFetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError" || err.message === "The user aborted a request.") {
      throw new Error(`Request to Python service timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

const fetch = fetchWithTimeout;

// GET /api/datasets — list this company's datasets (metadata only, no row data)
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM datasets WHERE company_id = $1 ORDER BY updated_at DESC",
      [req.user.companyId]
    );
    res.json({ datasets: rows.map(toListItem) });
  } catch (err) {
    console.error("List datasets error:", err);
    res.status(500).json({ error: "Could not load datasets." });
  }
});

// GET /api/datasets/:id — full dataset (rows, stats, dashboard, messages) to reopen
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Dataset not found." });
    res.json({ dataset: toFullItem(rows[0]) });
  } catch (err) {
    console.error("Get dataset error:", err);
    res.status(500).json({ error: "Could not load dataset." });
  }
});

// POST /api/datasets/upload — parses file upload, forwards to Python /profile, and returns results
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded." });
  }

  try {
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/profile", {
      method: "POST",
      body: formData
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      console.error("Python service profile error:", pythonRes.status, errText);
      return res.status(pythonRes.status).json({ error: `Profiling service failed: ${cleanErrorText(errText)}` });
    }

    const profile = await pythonRes.json();
    res.json(profile);
  } catch (err) {
    console.error("Forwarding profile request error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to communicate with profiling engine." });
  }
});

// POST /api/datasets/:id/clean — cleans dataset via Python and saves a new record
router.post("/:id/clean", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Cannot clean an empty dataset." });
    }

    const cleanPayload = {
      rows: sourceRows,
      columns: sourceCols
    };

    const pythonCleanRes = await fetch(PYTHON_SERVICE_URL + "/clean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanPayload)
    });

    if (!pythonCleanRes.ok) {
      const errText = await pythonCleanRes.text();
      console.error("Python cleaning service error:", pythonCleanRes.status, errText);
      return res.status(pythonCleanRes.status).json({ error: `Cleaning service failed: ${cleanErrorText(errText)}` });
    }

    const cleanResult = await pythonCleanRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "clean",
      totalTokens: 1000
    });

    const profilePayload = {
      rows: cleanResult.cleaned_data,
      columns: cleanResult.columns_list
    };

    const pythonProfileRes = await fetch(PYTHON_SERVICE_URL + "/profile-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilePayload)
    });

    if (!pythonProfileRes.ok) {
      const errText = await pythonProfileRes.text();
      console.error("Python profiling service error:", pythonProfileRes.status, errText);
      return res.status(pythonProfileRes.status).json({ error: `Profiling cleaned data failed: ${cleanErrorText(errText)}` });
    }

    const cleanProfile = await pythonProfileRes.json();

    const cleanedName = `${existing.name.replace(/ \(Cleaned\)$/, "")} (Cleaned)`;
    const cleanedDataJson = JSON.stringify({
      rows: cleanResult.cleaned_data,
      columns: cleanResult.columns_list,
      stats: cleanProfile.columns_info,
      quality: {
        score: cleanProfile.quality_score,
        missingCells: cleanProfile.missing_cells,
        missingRate: cleanProfile.missing_percentage,
        duplicateRows: cleanProfile.duplicate_rows
      },
      isRawText: false,
      rawText: ""
    });

    const result = await pool.query(
      `INSERT INTO datasets (company_id, created_by, name, row_count, column_count, quality_score, data_json, messages_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       RETURNING *`,
      [
        req.user.companyId,
        req.user.userId,
        cleanedName.slice(0, 200),
        cleanResult.cleaned_rows,
        cleanResult.cleaned_columns,
        (cleanProfile.quality_score !== undefined && !isNaN(Number(cleanProfile.quality_score))) ? Math.round(Number(cleanProfile.quality_score)) : null,
        cleanedDataJson,
        JSON.stringify([])
      ]
    );
    const saved = result.rows[0];

    const auditSummary = {
      duplicates_removed: cleanResult.changes.duplicates_removed,
      missing_values_filled: cleanResult.changes.missing_values_filled,
      whitespace_normalized: cleanResult.changes.whitespace_normalized,
      empty_columns_removed: cleanResult.changes.empty_columns_removed,
      constant_columns_removed: cleanResult.changes.constant_columns_removed
    };

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_CLEANED",
      `Cleaned dataset "${existing.name}" creating "${saved.name}" (Removed ${auditSummary.duplicates_removed} duplicates, filled ${auditSummary.missing_values_filled} nulls)`,
      req
    );

    res.status(201).json({
      success: true,
      sourceDataset: {
        id: existing.id,
        name: existing.name
      },
      cleanedDataset: {
        id: saved.id,
        name: saved.name,
        rowCount: saved.row_count,
        columnCount: saved.column_count,
        qualityScore: saved.quality_score
      },
      summary: {
        originalRows: cleanResult.original_rows,
        cleanedRows: cleanResult.cleaned_rows,
        originalColumns: cleanResult.original_columns,
        cleanedColumns: cleanResult.cleaned_columns,
        duplicatesRemoved: cleanResult.changes.duplicates_removed,
        missingValuesFilled: cleanResult.changes.missing_values_filled,
        whitespaceNormalized: cleanResult.changes.whitespace_normalized,
        emptyColumnsRemoved: cleanResult.changes.empty_columns_removed,
        constantColumnsRemoved: cleanResult.changes.constant_columns_removed
      },
      profile: cleanProfile
    });
  } catch (err) {
    console.error("Dataset cleaning controller error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to perform dataset cleaning operations." });
  }
});

// POST /api/datasets/:id/eda — generates recommended EDA visualization specs and aggregations
router.post("/:id/eda", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Cannot analyze an empty dataset." });
    }

    const edaPayload = {
      rows: sourceRows,
      columns: sourceCols
    };

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/eda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edaPayload)
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      console.error("Python EDA service error:", pythonRes.status, errText);
      return res.status(pythonRes.status).json({ error: `EDA analysis failed: ${cleanErrorText(errText)}` });
    }

    const edaResult = await pythonRes.json();

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_EDA_GENERATED",
      `Generated automatic EDA visual specifications for dataset "${existing.name}" (${edaResult.charts.length} charts recommended)`,
      req
    );

    res.json({
      success: true,
      datasetId: existing.id,
      name: existing.name,
      charts: edaResult.charts
    });
  } catch (err) {
    console.error("Dataset EDA controller error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to generate exploratory data analysis." });
  }
});

// POST /api/datasets/:id/statistics — generates descriptive statistics, distributions, and correlations
router.post("/:id/statistics", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Cannot analyze an empty dataset." });
    }

    const statsPayload = {
      rows: sourceRows,
      columns: sourceCols
    };

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/statistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsPayload)
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      console.error("Python Statistics service error:", pythonRes.status, errText);
      return res.status(pythonRes.status).json({ error: `Statistics analysis failed: ${cleanErrorText(errText)}` });
    }

    const statsResult = await pythonRes.json();

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_STATISTICS_GENERATED",
      `Generated descriptive statistics and correlations for dataset "${existing.name}"`,
      req
    );

    res.json({
      success: true,
      datasetId: existing.id,
      name: existing.name,
      statistics: statsResult
    });
  } catch (err) {
    console.error("Dataset Statistics controller error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to generate dataset statistics." });
  }
});

// POST /api/datasets/:id/insights — generates automated AI insights and next-step recommendations
router.post("/:id/insights", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found or access denied." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Dataset cannot be empty." });
    }

    // 1. Enforce defensive 10,000-row limit in Node gateway
    const sampledRows = sourceRows.slice(0, 10000);

    // 2. Reuse /statistics calculation dynamically on sampled data
    const statsPayload = {
      rows: sampledRows,
      columns: sourceCols
    };

    const pythonStatsRes = await fetch(PYTHON_SERVICE_URL + "/statistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsPayload)
    });

    if (!pythonStatsRes.ok) {
      const errText = await pythonStatsRes.text();
      return res.status(pythonStatsRes.status).json({ error: `Insights failed during stats phase: ${cleanErrorText(errText)}` });
    }
    const statisticsData = await pythonStatsRes.json();

    // 3. Construct the profile representation based on existing columns stats
    const profilePayload = {
      rows: existing.row_count,
      columns: existing.column_count,
      duplicate_rows: sourceData.quality ? sourceData.quality.duplicateRows : 0,
      missing_cells: sourceData.quality ? sourceData.quality.missingCells : 0,
      missing_percentage: sourceData.quality ? sourceData.quality.missingRate : 0.0,
      quality_score: existing.quality_score || (sourceData.quality ? sourceData.quality.score : 100.0),
      columns_info: sourceData.stats || [],
      rows_data: [],
      columns_list: sourceCols
    };

    // 4. Ingest and call the Python Insights engine orchestrator
    const insightsPayload = {
      rows: sampledRows,
      columns: sourceCols,
      profile: profilePayload,
      statistics: statisticsData
    };

    const pythonInsightsRes = await fetch(PYTHON_SERVICE_URL + "/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insightsPayload)
    });

    if (!pythonInsightsRes.ok) {
      const errText = await pythonInsightsRes.text();
      return res.status(pythonInsightsRes.status).json({ error: `Insights generation failed: ${cleanErrorText(errText)}` });
    }

    const insightsResult = await pythonInsightsRes.json();

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_INSIGHTS_GENERATED",
      `Generated automated AI insights and next-step recommendations for dataset "${existing.name}"`,
      req
    );

    res.json(insightsResult);
  } catch (err) {
    console.error("Dataset Insights controller error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to perform dataset insights scan." });
  }
});

// POST /api/datasets/:id/chat — handles NLQ chat queries grounded strictly on verified metrics
router.post("/:id/chat", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  const { question } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question string parameter is required." });
  }

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found or access denied." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Dataset cannot be empty." });
    }

    // 1. Enforce defensive 10,000-row limit in Node gateway
    const sampledRows = sourceRows.slice(0, 10000);

    // 2. Fetch statistics dynamically on the sampled rows
    const statsPayload = {
      rows: sampledRows,
      columns: sourceCols
    };

    const pythonStatsRes = await fetch(PYTHON_SERVICE_URL + "/statistics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsPayload)
    });

    if (!pythonStatsRes.ok) {
      const errText = await pythonStatsRes.text();
      const cleanErr = errText.startsWith("<") ? "Analysis engine service is temporarily unavailable." : errText;
      return res.status(pythonStatsRes.status).json({ error: `Chat NLP unavailable: ${cleanErr}` });
    }
    const statisticsData = await pythonStatsRes.json();

    // 3. Construct the profile representation based on existing columns stats
    const profilePayload = {
      rows: existing.row_count,
      columns: existing.column_count,
      duplicate_rows: sourceData.quality ? sourceData.quality.duplicateRows : 0,
      missing_cells: sourceData.quality ? sourceData.quality.missingCells : 0,
      missing_percentage: sourceData.quality ? sourceData.quality.missingRate : 0.0,
      quality_score: existing.quality_score || (sourceData.quality ? sourceData.quality.score : 100.0),
      columns_info: sourceData.stats || [],
      rows_data: [],
      columns_list: sourceCols
    };

    // 4. Map the conversation history database rows to the ChatRequest schema
    const rawHistory = existing.messages_json || [];
    const historyList = [];
    for (const msg of rawHistory) {
      if (msg.role && (msg.content || msg.content === "")) {
        historyList.push({
          role: msg.role,
          content: String(msg.content)
        });
      }
    }

    // 5. Query the Python Chat NLP Engine endpoint
    const chatPayload = {
      question: question.trim(),
      history: historyList,
      rows: sampledRows,
      columns: sourceCols,
      profile: profilePayload,
      statistics: statisticsData
    };

    const pythonChatRes = await fetch(PYTHON_SERVICE_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload)
    });

    if (!pythonChatRes.ok) {
      const errText = await pythonChatRes.text();
      const cleanErr = errText.startsWith("<") ? "Analysis engine service is temporarily unavailable." : errText;
      return res.status(pythonChatRes.status).json({ error: `NLQ Chat Engine unavailable: ${cleanErr}` });
    }

    const chatResult = await pythonChatRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "chat",
      totalTokens: 1000
    });

    // 6. Persist conversation: append the new user and assistant message records
    const updatedMessages = [
      ...rawHistory,
      { role: "user", kind: "text", content: question.trim() },
      {
        role: "assistant",
        kind: "grounded_chat",
        content: chatResult.answer,
        intent: chatResult.intent,
        supporting_values: chatResult.supporting_values,
        relevant_columns: chatResult.relevant_columns,
        confidence_score: chatResult.confidence_score,
        association_disclaimer: chatResult.association_disclaimer,
        dataset_context: chatResult.dataset_context
      }
    ];

    await pool.query(
      "UPDATE datasets SET messages_json = $1::jsonb, updated_at = now() WHERE id = $2",
      [JSON.stringify(updatedMessages), id]
    );

    // 7. Audit log the answered query
    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_CHAT_ANSWERED",
      `AI Analyst chat query answered: "${question.slice(0, 100)}..."`,
      req
    );

    res.json({
      success: true,
      answer: chatResult.answer,
      intent: chatResult.intent,
      supporting_values: chatResult.supporting_values,
      relevant_columns: chatResult.relevant_columns,
      confidence_score: chatResult.confidence_score,
      association_disclaimer: chatResult.association_disclaimer,
      dataset_context: chatResult.dataset_context,
      messages: updatedMessages
    });
  } catch (err) {
    console.error("Dataset Chat controller error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to process chat query request." });
  }
});

// POST /api/datasets/:id/ml/analyze — identifies candidates and clustering availability
router.post("/:id/ml/analyze", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Dataset rows list is empty." });
    }

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/ml/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: sourceRows, columns: sourceCols })
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      return res.status(pythonRes.status).json({ error: `ML analysis failed: ${cleanErrorText(errText)}` });
    }

    const result = await pythonRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "ml_analyze",
      totalTokens: 500
    });
    res.json(result);
  } catch (err) {
    console.error("ML analyze endpoint error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to run dataset ML analysis." });
  }
});

// POST /api/datasets/:id/ml/train — trains classification, regression, or clustering models
router.post("/:id/ml/train", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  const { task_type, target, features, test_size, cv_folds } = req.body || {};
  if (!task_type || !Array.isArray(features) || features.length === 0) {
    return res.status(400).json({ error: "task_type and non-empty features array are required." });
  }

  if (test_size !== undefined && (typeof test_size !== "number" || test_size < 0.05 || test_size > 0.90)) {
    return res.status(400).json({ error: "test_size must be a number between 0.05 and 0.90." });
  }
  if (cv_folds !== undefined && (!Number.isInteger(cv_folds) || cv_folds < 2 || cv_folds > 10)) {
    return res.status(400).json({ error: "cv_folds must be an integer between 2 and 10." });
  }

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    const modelId = Math.floor(Math.random() * 10000000);

    const payload = {
      rows: sourceRows,
      columns: sourceCols,
      task_type,
      target,
      features,
      model_id: modelId,
      test_size: test_size || 0.2,
      cv_folds: cv_folds || 5
    };

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/ml/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      return res.status(pythonRes.status).json({ error: `Model training failed: ${cleanErrorText(errText)}` });
    }

    const trainResult = await pythonRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "ml_train",
      totalTokens: 10000
    });

    const { rows: versionRows } = await pool.query(
      `SELECT COALESCE(MAX(model_version), 0) + 1 AS next_version 
       FROM ml_models 
       WHERE dataset_id = $1 AND (target_column = $2 OR (target_column IS NULL AND $2 IS NULL)) AND algorithm = $3`,
      [id, target || null, trainResult.best_model]
    );
    const nextVersion = versionRows[0].next_version;

    const modelPath = `storage/models/model_${modelId}.joblib`;
    const insertRes = await pool.query(
      `INSERT INTO ml_models (
        dataset_id, company_id, task_type, target_column, algorithm, 
        metrics, feature_columns, training_rows, model_path, 
        model_version, framework_version, random_state, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        id,
        req.user.companyId,
        task_type,
        target || null,
        trainResult.best_model,
        JSON.stringify(trainResult.comparisons || trainResult.cluster_sizes),
        JSON.stringify(features),
        trainResult.training_rows,
        modelPath,
        nextVersion,
        "scikit-learn",
        42,
        req.user.userId
      ]
    );
    const dbModelId = insertRes.rows[0].id;

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_MODEL_TRAINED",
      `Trained ${task_type} model version v${nextVersion} using algorithm "${trainResult.best_model}" for dataset "${existing.name}"`,
      req
    );

    res.json({
      success: true,
      model_id: dbModelId,
      registry_id: modelId,
      version: nextVersion,
      ...trainResult
    });
  } catch (err) {
    console.error("ML train endpoint error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to train machine learning models." });
  }
});

// POST /api/datasets/:id/ml/predict — executes model inference predictions
router.post("/:id/ml/predict", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  const { model_id, rows: inputRows } = req.body || {};
  
  if (!model_id || !Array.isArray(inputRows) || inputRows.length === 0) {
    return res.status(400).json({ error: "model_id and non-empty rows array are required." });
  }

  try {
    const { rows: modelRows } = await pool.query(
      `SELECT * FROM ml_models WHERE id = $1 AND company_id = $2`,
      [model_id, req.user.companyId]
    );
    const modelRecord = modelRows[0];
    if (!modelRecord) {
      return res.status(404).json({ error: "Model not found or access denied." });
    }

    const matches = modelRecord.model_path.match(/model_(\d+)\.joblib/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid model file registry path." });
    }
    const registryId = parseInt(matches[1]);

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/ml/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: registryId, rows: inputRows })
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      return res.status(pythonRes.status).json({ error: `Predictions failed: ${cleanErrorText(errText)}` });
    }

    const result = await pythonRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "ml_predict",
      totalTokens: 100
    });
    res.json(result);
  } catch (err) {
    console.error("ML predict endpoint error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to generate predictions." });
  }
});

// POST /api/datasets/:id/forecast/analyze — evaluates time-series forecasting suitability
router.post("/:id/forecast/analyze", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    if (sourceRows.length === 0) {
      return res.status(400).json({ error: "Dataset rows list is empty." });
    }

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/forecast/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: sourceRows, columns: sourceCols })
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      return res.status(pythonRes.status).json({ error: `Forecasting analysis failed: ${cleanErrorText(errText)}` });
    }

    const result = await pythonRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "forecast_analyze",
      totalTokens: 500
    });

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_FORECAST_ANALYZED",
      `Analyzed time-series forecasting suitability for dataset "${existing.name}". Suitability: ${result.forecastable ? "YES" : "NO"}`,
      req
    );

    res.json(result);
  } catch (err) {
    console.error("Forecast analyze endpoint error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to run dataset forecasting suitability check." });
  }
});

// POST /api/datasets/:id/forecast/train — trains forecast models and returns forecast values
router.post("/:id/forecast/train", requireTokenQuota, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  const { date_column, target_column, frequency, horizon } = req.body || {};
  if (!date_column || !target_column || !frequency || !horizon) {
    return res.status(400).json({ error: "date_column, target_column, frequency, and horizon parameters are required." });
  }

  const parsedHorizon = Number(horizon);
  if (horizon === undefined || !Number.isInteger(parsedHorizon) || parsedHorizon < 1 || parsedHorizon > 100) {
    return res.status(400).json({ error: "horizon must be an integer between 1 and 100." });
  }

  try {
    const { rows: datasetRows } = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = datasetRows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const sourceData = existing.data_json || {};
    const sourceRows = sourceData.rows || [];
    const sourceCols = sourceData.columns || [];

    const registryId = Math.floor(Math.random() * 10000000);

    const payload = {
      rows: sourceRows,
      columns: sourceCols,
      date_column,
      target_column,
      frequency,
      horizon: Number(horizon),
      model_id: registryId
    };

    const pythonRes = await fetch(PYTHON_SERVICE_URL + "/forecast/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      return res.status(pythonRes.status).json({ error: `Forecasting training failed: ${cleanErrorText(errText)}` });
    }

    const trainResult = await pythonRes.json();

    // Record token usage immediately after successful AI/analytical call returns
    await recordUsage({
      companyId: req.user.companyId,
      userId: req.user.userId,
      datasetId: id,
      requestType: "forecast_train",
      totalTokens: 5000
    });

    const { rows: versionRows } = await pool.query(
      `SELECT COALESCE(MAX(model_version), 0) + 1 AS next_version 
       FROM forecast_models 
       WHERE dataset_id = $1 AND target_column = $2 AND algorithm = $3`,
      [id, target_column, trainResult.algorithm]
    );
    const nextVersion = versionRows[0].next_version;

    const modelPath = `storage/forecasts/forecast_${registryId}.joblib`;
    const insertRes = await pool.query(
      `INSERT INTO forecast_models (
        dataset_id, company_id, date_column, target_column, frequency,
        algorithm, parameters, metrics, forecast_horizon, training_rows,
        validation_rows, seasonal_period, training_start, training_end,
        model_path, model_version, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        id,
        req.user.companyId,
        date_column,
        target_column,
        frequency,
        trainResult.algorithm,
        JSON.stringify({ horizon, frequency }),
        JSON.stringify(trainResult.comparisons),
        Number(horizon),
        trainResult.training_rows,
        trainResult.validation_rows,
        trainResult.insights.seasonal_period || null,
        trainResult.training_start ? new Date(trainResult.training_start) : null,
        trainResult.training_end ? new Date(trainResult.training_end) : null,
        modelPath,
        nextVersion,
        req.user.userId
      ]
    );
    const dbModelId = insertRes.rows[0].id;

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "DATASET_FORECAST_GENERATED",
      `Generated forecast values for dataset "${existing.name}". Horizon: ${horizon} steps. Best model: ${trainResult.algorithm}`,
      req
    );

    await logAction(
      req.user.companyId,
      req.user.userId,
      req.user.email,
      "FORECAST_MODEL_TRAINED",
      `Trained forecast model v${nextVersion} using algorithm "${trainResult.algorithm}" for dataset "${existing.name}"`,
      req
    );

    res.json({
      success: true,
      model_id: dbModelId,
      registry_id: registryId,
      version: nextVersion,
      ...trainResult
    });
  } catch (err) {
    console.error("Forecast train endpoint error:", err);
    if (err.message && err.message.includes("timed out")) {
      return res.status(504).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to fit forecast model and project values." });
  }
});

// POST /api/datasets — create a new dataset record right after a file is parsed
router.post("/", async (req, res) => {
  const { name, rows, columns, stats, quality, messages, isRawText, rawText } = req.body || {};

  if (!name || !Array.isArray(rows) || !Array.isArray(columns)) {
    return res.status(400).json({ error: "name, rows, and columns are required." });
  }

  const dataJson = JSON.stringify({ 
    rows, 
    columns, 
    stats: stats || [], 
    quality: quality || null,
    isRawText: !!isRawText,
    rawText: rawText || ""
  });
  const messagesJson = JSON.stringify(messages || []);
  if (dataJson.length > MAX_JSON_LENGTH || messagesJson.length > MAX_JSON_LENGTH) {
    return res.status(413).json({ error: "Dataset is too large to store." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO datasets (company_id, created_by, name, row_count, column_count, quality_score, data_json, messages_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       RETURNING *`,
      [
        req.user.companyId,
        req.user.userId,
        String(name).slice(0, 200),
        rows.length,
        columns.length,
        (quality && quality.score !== undefined && !isNaN(Number(quality.score))) ? Math.round(Number(quality.score)) : null,
        dataJson,
        messagesJson
      ]
    );
    const saved = result.rows[0];
    await logAction(req.user.companyId, req.user.userId, req.user.email, "UPLOAD_DATASET", `Uploaded dataset "${saved.name}" (${rows.length} rows, ${columns.length} columns)`, req);
    res.status(201).json({ dataset: toListItem(saved) });
  } catch (err) {
    console.error("Create dataset error:", err);
    res.status(500).json({ error: "Could not save dataset." });
  }
});

// PUT /api/datasets/:id — update dashboard and/or chat history for a dataset
// (rows/columns are immutable after creation; only dashboard + messages change over time)
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const existingRes = await pool.query(
      "SELECT * FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    const existing = existingRes.rows[0];
    if (!existing) return res.status(404).json({ error: "Dataset not found." });

    const { dashboard, messages } = req.body || {};
    const nextDashboard = dashboard !== undefined ? dashboard : existing.dashboard_json;
    const nextMessages = messages !== undefined ? messages : existing.messages_json;

    const dashboardJson = nextDashboard != null ? JSON.stringify(nextDashboard) : null;
    const messagesJson = JSON.stringify(nextMessages || []);

    if ((dashboardJson && dashboardJson.length > MAX_JSON_LENGTH) || messagesJson.length > MAX_JSON_LENGTH) {
      return res.status(413).json({ error: "Update payload is too large to store." });
    }

    const result = await pool.query(
      `UPDATE datasets
       SET dashboard_json = $1::jsonb, messages_json = $2::jsonb, updated_at = now()
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [dashboardJson, messagesJson, id, req.user.companyId]
    );
    res.json({ dataset: toListItem(result.rows[0]) });
  } catch (err) {
    console.error("Update dataset error:", err);
    res.status(500).json({ error: "Could not update dataset." });
  }
});

// DELETE /api/datasets/:id
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid dataset id." });

  try {
    const existingRes = await pool.query(
      "SELECT id FROM datasets WHERE id = $1 AND company_id = $2",
      [id, req.user.companyId]
    );
    if (!existingRes.rows[0]) return res.status(404).json({ error: "Dataset not found." });

    const targetName = (await pool.query("SELECT name FROM datasets WHERE id = $1 AND company_id = $2", [id, req.user.companyId])).rows[0]?.name || String(id);
    await pool.query("DELETE FROM datasets WHERE id = $1 AND company_id = $2", [id, req.user.companyId]);
    await logAction(req.user.companyId, req.user.userId, req.user.email, "DELETE_DATASET", `Deleted dataset "${targetName}"`, req);
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete dataset error:", err);
    res.status(500).json({ error: "Could not delete dataset." });
  }
});

export default router;
