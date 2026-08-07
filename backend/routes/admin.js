import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /api/admin/summary — quick company-level counters for the admin dashboard
router.get("/summary", async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const memberCountRes = await pool.query("SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1", [companyId]);
    const datasetStatsRes = await pool.query(
      `SELECT COUNT(*)::int AS "datasetCount",
              COALESCE(SUM(row_count), 0)::bigint AS "totalRows",
              MAX(updated_at) AS "lastActivity"
       FROM datasets WHERE company_id = $1`,
      [companyId]
    );
    const stats = datasetStatsRes.rows[0];

    res.json({
      summary: {
        memberCount: memberCountRes.rows[0].n,
        datasetCount: stats.datasetCount,
        totalRowsAnalyzed: Number(stats.totalRows),
        lastActivityAt: stats.lastActivity
      }
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ error: "Could not load summary." });
  }
});

// GET /api/admin/members — list everyone in this admin's company
router.get("/members", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE company_id = $1 ORDER BY created_at ASC",
      [req.user.companyId]
    );
    res.json({
      members: rows.map(m => ({ id: m.id, email: m.email, role: m.role, createdAt: m.created_at }))
    });
  } catch (err) {
    console.error("Admin members error:", err);
    res.status(500).json({ error: "Could not load members." });
  }
});

// DELETE /api/admin/members/:id — remove a teammate from the company
router.delete("/members/:id", async (req, res) => {
  const companyId = req.user.companyId;
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) return res.status(400).json({ error: "Invalid member id." });

  try {
    const target = (await pool.query(
      "SELECT * FROM users WHERE id = $1 AND company_id = $2",
      [targetId, companyId]
    )).rows[0];
    if (!target) return res.status(404).json({ error: "Member not found." });

    if (targetId === req.user.userId) {
      return res.status(400).json({ error: "You can't remove your own account from here." });
    }

    if (target.role === "admin") {
      const adminCountRes = await pool.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [companyId]
      );
      if (adminCountRes.rows[0].n <= 1) {
        return res.status(400).json({ error: "Can't remove the last admin — promote another member first." });
      }
    }

    await pool.query("DELETE FROM users WHERE id = $1 AND company_id = $2", [targetId, companyId]);
    res.json({ removed: true });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Could not remove member." });
  }
});

// PATCH /api/admin/members/:id — promote a member to admin, or demote an admin to member
router.patch("/members/:id", async (req, res) => {
  const companyId = req.user.companyId;
  const targetId = Number(req.params.id);
  const { role } = req.body || {};

  if (!Number.isInteger(targetId)) return res.status(400).json({ error: "Invalid member id." });
  if (role !== "admin" && role !== "member") {
    return res.status(400).json({ error: "role must be 'admin' or 'member'." });
  }
  if (targetId === req.user.userId) {
    return res.status(400).json({ error: "You can't change your own role from here." });
  }

  try {
    const target = (await pool.query(
      "SELECT * FROM users WHERE id = $1 AND company_id = $2",
      [targetId, companyId]
    )).rows[0];
    if (!target) return res.status(404).json({ error: "Member not found." });

    if (target.role === role) {
      return res.json({ updated: false, role: target.role }); // already in that state
    }

    // Demoting an admin: make sure at least one admin remains afterward.
    if (target.role === "admin" && role === "member") {
      const adminCountRes = await pool.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [companyId]
      );
      if (adminCountRes.rows[0].n <= 1) {
        return res.status(400).json({ error: "Can't demote the last admin — promote someone else first." });
      }
    }

    await pool.query("UPDATE users SET role = $1 WHERE id = $2 AND company_id = $3", [role, targetId, companyId]);
    res.json({ updated: true, role });
  } catch (err) {
    console.error("Update member role error:", err);
    res.status(500).json({ error: "Could not update member role." });
  }
});

// GET /api/admin/usage — company-wide AI usage: totals, by user, by dataset,
// and a daily breakdown for the last 14 days.
router.get("/usage", async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const totalsRes = await pool.query(
      `SELECT COUNT(*)::int AS requests,
              COALESCE(SUM(total_tokens), 0)::bigint AS tokens,
              COALESCE(SUM(estimated_cost), 0)::numeric AS cost
       FROM ai_usage WHERE company_id = $1`,
      [companyId]
    );
    const totals = totalsRes.rows[0];

    const byUserRes = await pool.query(
      `SELECT COALESCE(u.email, '(removed user)') AS email,
              COUNT(*)::int AS requests,
              COALESCE(SUM(a.total_tokens), 0)::bigint AS tokens,
              COALESCE(SUM(a.estimated_cost), 0)::numeric AS cost
       FROM ai_usage a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.company_id = $1
       GROUP BY u.email
       ORDER BY tokens DESC`,
      [companyId]
    );

    const byDatasetRes = await pool.query(
      `SELECT a.dataset_id, COALESCE(d.name, '(deleted dataset)') AS name,
              COUNT(*)::int AS requests,
              COALESCE(SUM(a.total_tokens), 0)::bigint AS tokens,
              COALESCE(SUM(a.estimated_cost), 0)::numeric AS cost
       FROM ai_usage a
       LEFT JOIN datasets d ON d.id = a.dataset_id
       WHERE a.company_id = $1
       GROUP BY a.dataset_id, d.name
       ORDER BY tokens DESC`,
      [companyId]
    );

    const byDayRes = await pool.query(
      `SELECT date_trunc('day', created_at)::date AS day,
              COUNT(*)::int AS requests,
              COALESCE(SUM(total_tokens), 0)::bigint AS tokens
       FROM ai_usage
       WHERE company_id = $1 AND created_at >= now() - interval '14 days'
       GROUP BY day
       ORDER BY day ASC`,
      [companyId]
    );

    res.json({
      usage: {
        totalRequests: totals.requests,
        totalTokens: Number(totals.tokens),
        estimatedCost: Number(totals.cost),
        byUser: byUserRes.rows.map(r => ({
          email: r.email, requests: r.requests, tokens: Number(r.tokens), cost: Number(r.cost)
        })),
        byDataset: byDatasetRes.rows.map(r => ({
          datasetId: r.dataset_id, name: r.name, requests: r.requests, tokens: Number(r.tokens), cost: Number(r.cost)
        })),
        byDay: byDayRes.rows.map(r => ({
          date: r.day, requests: r.requests, tokens: Number(r.tokens)
        }))
      }
    });
  } catch (err) {
    console.error("Admin usage error:", err);
    res.status(500).json({ error: "Could not load usage data." });
  }
});

// GET /api/admin/datasets — every dataset in the company, with who created it
router.get("/datasets", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.name, d.row_count, d.column_count, d.quality_score,
              d.created_at, d.updated_at, u.email AS created_by_email
       FROM datasets d
       LEFT JOIN users u ON u.id = d.created_by
       WHERE d.company_id = $1
       ORDER BY d.updated_at DESC`,
      [req.user.companyId]
    );

    res.json({
      datasets: rows.map(r => ({
        id: r.id,
        name: r.name,
        rowCount: r.row_count,
        columnCount: r.column_count,
        qualityScore: r.quality_score,
        createdByEmail: r.created_by_email || "(removed user)",
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    });
  } catch (err) {
    console.error("Admin datasets error:", err);
    res.status(500).json({ error: "Could not load company datasets." });
  }
});

// POST /api/admin/upgrade — Upgrade company subscription tier
router.post("/upgrade", async (req, res) => {
  const companyId = req.user.companyId;
  const { tier } = req.body || {};

  if (!tier || !["free", "pro", "enterprise"].includes(tier)) {
    return res.status(400).json({ error: "Invalid tier specified." });
  }

  try {
    await pool.query(
      "UPDATE companies SET tier = $1 WHERE id = $2",
      [tier, companyId]
    );
    res.json({ success: true, tier });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Could not upgrade tier." });
  }
});

export default router;
