// backend/routes/analytics.js
import { Router } from "express";
import crypto from "crypto";
import pool from "../db.js";

const router = Router();

// In-memory fallback tracking for when database is in transition
const memoryStats = {
  uniqueBrowsers: new Set(),
  totalSessions: new Set()
};

// Ensure site_visits table exists
let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_visits (
        id SERIAL PRIMARY KEY,
        client_id TEXT NOT NULL,
        session_id TEXT,
        ip_hash TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_site_visits_client ON site_visits(client_id);
    `);
    tableChecked = true;
  } catch (err) {
    console.warn("Could not ensure site_visits table in Postgres:", err.message);
  }
}

// POST /api/analytics/visit — record visit from landing page
router.post("/visit", async (req, res) => {
  const { clientId, sessionId } = req.body || {};
  if (!clientId || typeof clientId !== "string") {
    return res.status(400).json({ error: "clientId is required" });
  }

  const safeClient = clientId.slice(0, 100);
  const safeSession = typeof sessionId === "string" ? sessionId.slice(0, 100) : null;
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
  const ipHash = crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 16);
  const userAgent = (req.headers["user-agent"] || "").slice(0, 255);

  // Update in-memory tracker
  memoryStats.uniqueBrowsers.add(safeClient);
  if (safeSession) memoryStats.totalSessions.add(safeSession);

  try {
    await ensureTable();
    await pool.query(
      "INSERT INTO site_visits (client_id, session_id, ip_hash, user_agent) VALUES ($1, $2, $3, $4)",
      [safeClient, safeSession, ipHash, userAgent]
    );
  } catch (err) {
    // Graceful fallback to memory tracking
    console.warn("Analytics DB write notice:", err.message);
  }

  res.json({ ok: true });
});

// GET /api/analytics/stats — site-wide unique browser and session counts
router.get("/stats", async (req, res) => {
  try {
    await ensureTable();
    const { rows } = await pool.query(`
      SELECT 
        COUNT(DISTINCT client_id)::int AS "uniqueBrowsers",
        COUNT(DISTINCT session_id)::int AS "totalSessions"
      FROM site_visits
    `);
    const dbUnique = rows[0]?.uniqueBrowsers || 0;
    const dbSessions = rows[0]?.totalSessions || 0;

    res.json({
      status: "live",
      uniqueBrowsers: dbUnique,
      totalSessions: dbSessions,
      label: "Unique Browsers",
      disclaimer: "Measures distinct browser clients recording visit events to backend analytics. Single users on multiple devices count separately."
    });
  } catch (err) {
    res.json({
      status: "unavailable",
      uniqueBrowsers: null,
      totalSessions: null,
      label: "Analytics Temporarily Unavailable",
      disclaimer: "Site-wide analytics database is currently unreachable. Live visitor telemetry paused."
    });
  }
});

export default router;
