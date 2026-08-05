import { Router } from "express";
import pool from "../db.js";

const router = Router();

const MAX_JSON_LENGTH = 12 * 1024 * 1024; // ~12MB of serialized rows/columns/stats

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
    dashboard: row.dashboard_json || null,
    messages: row.messages_json || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

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

// POST /api/datasets — create a new dataset record right after a file is parsed
router.post("/", async (req, res) => {
  const { name, rows, columns, stats, quality, messages } = req.body || {};

  if (!name || !Array.isArray(rows) || !Array.isArray(columns)) {
    return res.status(400).json({ error: "name, rows, and columns are required." });
  }

  const dataJson = JSON.stringify({ rows, columns, stats: stats || [], quality: quality || null });
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
        quality?.score ?? null,
        dataJson,
        messagesJson
      ]
    );
    res.status(201).json({ dataset: toListItem(result.rows[0]) });
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

    await pool.query("DELETE FROM datasets WHERE id = $1 AND company_id = $2", [id, req.user.companyId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete dataset error:", err);
    res.status(500).json({ error: "Could not delete dataset." });
  }
});

export default router;
