import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool, { logAction } from "../db.js";

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
  if (targetId === req.user.userId) {
    return res.status(400).json({ error: "You can't remove yourself from here." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the parent company row to serialize all concurrent admin count checks for this workspace
    await client.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [companyId]);

    const target = (await client.query(
      "SELECT * FROM users WHERE id = $1 AND company_id = $2",
      [targetId, companyId]
    )).rows[0];
    if (!target) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Member not found." });
    }

    if (target.role === "admin") {
      const adminCountRes = await client.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [companyId]
      );
      if (adminCountRes.rows[0].n <= 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Can't remove the last admin — promote another member first." });
      }
    }

    await client.query("DELETE FROM users WHERE id = $1 AND company_id = $2", [targetId, companyId]);
    await logAction(companyId, req.user.userId, req.user.email, "REMOVE_MEMBER", `Removed member ${target.email}`, req);
    
    await client.query("COMMIT");
    res.json({ removed: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Remove member error:", err);
    res.status(500).json({ error: "Could not remove member." });
  } finally {
    client.release();
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the parent company row to serialize all concurrent admin count checks for this workspace
    await client.query("SELECT id FROM companies WHERE id = $1 FOR UPDATE", [companyId]);

    const target = (await client.query(
      "SELECT * FROM users WHERE id = $1 AND company_id = $2",
      [targetId, companyId]
    )).rows[0];
    if (!target) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Member not found." });
    }

    if (target.role === role) {
      await client.query("ROLLBACK");
      return res.json({ updated: false, role: target.role });
    }

    if (target.role === "admin" && role === "member") {
      const adminCountRes = await client.query(
        "SELECT COUNT(*)::int AS n FROM users WHERE company_id = $1 AND role = 'admin'",
        [companyId]
      );
      if (adminCountRes.rows[0].n <= 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Can't demote the last admin — promote someone else first." });
      }
    }

    await client.query("UPDATE users SET role = $1 WHERE id = $2 AND company_id = $3", [role, targetId, companyId]);
    await logAction(companyId, req.user.userId, req.user.email, "UPDATE_ROLE", `Updated role of ${target.email} to ${role}`, req);
    
    await client.query("COMMIT");
    res.json({ updated: true, role });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Update member role error:", err);
    res.status(500).json({ error: "Could not update member role." });
  } finally {
    client.release();
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
    await logAction(companyId, req.user.userId, req.user.email, "UPGRADE_PLAN", `Upgraded plan tier to ${tier}`, req);
    res.json({ success: true, tier });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Could not upgrade tier." });
  }
});

// GET /api/admin/audit-logs — Paginated list of audit logs
router.get("/audit-logs", async (req, res) => {
  const companyId = req.user.companyId;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  try {
    const countRes = await pool.query(
      "SELECT COUNT(*)::int AS n FROM audit_logs WHERE company_id = $1",
      [companyId]
    );
    const total = countRes.rows[0].n;

    const { rows } = await pool.query(
      `SELECT id, user_id, user_email, action, target, ip_address, user_agent, created_at
       FROM audit_logs
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    res.json({
      logs: rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        userEmail: r.user_email,
        action: r.action,
        target: r.target,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        createdAt: r.created_at
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ error: "Could not load audit logs." });
  }
});

// POST /api/admin/invites — Create a new teammate invite token
router.post("/invites", async (req, res) => {
  const companyId = req.user.companyId;
  const { email, role, maxUses, expiresDays } = req.body || {};
  
  const finalRole = role === "admin" ? "admin" : "member";
  const finalMaxUses = Math.max(1, Number(maxUses) || 1);
  const days = Math.max(1, Math.min(90, Number(expiresDays) || 7));
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const normalizedInviteEmail = typeof email === "string" && email.trim()
    ? email.trim().toLowerCase()
    : null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  // Store the SHA-256 hash of the token to secure database dumps
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    await pool.query(
      `INSERT INTO invites (company_id, token, email, role, created_by, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [companyId, hash, normalizedInviteEmail, finalRole, req.user.userId, finalMaxUses, expiresAt]
    );

    await logAction(companyId, req.user.userId, req.user.email, "CREATE_INVITE", `Created invite link (max uses: ${finalMaxUses})`, req);
    
    res.status(201).json({
      invite: {
        token: rawToken, // Send the raw token back to the creator once
        email: normalizedInviteEmail,
        role: finalRole,
        maxUses: finalMaxUses,
        expiresAt
      }
    });
  } catch (err) {
    console.error("Create invite error:", err);
    res.status(500).json({ error: "Could not create invitation link." });
  }
});

// GET /api/admin/invites — List pending/active invite links
router.get("/invites", async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const { rows } = await pool.query(
      `SELECT id, token, email, role, max_uses, use_count, expires_at, created_at
       FROM invites
       WHERE company_id = $1 AND expires_at > now() AND use_count < max_uses
       ORDER BY created_at DESC`,
      [companyId]
    );
    res.json({
      invites: rows.map(r => ({
        id: r.id,
        // Send a masked placeholder for security
        token: r.token.slice(0, 8) + "...",
        email: r.email,
        role: r.role,
        maxUses: r.max_uses,
        useCount: r.use_count,
        expiresAt: r.expires_at,
        createdAt: r.created_at
      }))
    });
  } catch (err) {
    console.error("Get invites error:", err);
    res.status(500).json({ error: "Could not load invites list." });
  }
});

// DELETE /api/admin/invites/:id — Revoke a pending invite token early
router.delete("/invites/:id", async (req, res) => {
  const companyId = req.user.companyId;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid invite id." });

  try {
    const target = (await pool.query(
      "SELECT * FROM invites WHERE id = $1 AND company_id = $2",
      [id, companyId]
    )).rows[0];
    if (!target) return res.status(404).json({ error: "Invite not found." });

    await pool.query("DELETE FROM invites WHERE id = $1 AND company_id = $2", [id, companyId]);
    await logAction(companyId, req.user.userId, req.user.email, "REVOKE_INVITE", `Revoked invite token early`, req);
    
    res.json({ revoked: true });
  } catch (err) {
    console.error("Revoke invite error:", err);
    res.status(500).json({ error: "Could not revoke invite." });
  }
});

// DELETE /api/admin/workspace — Soft-delete workspace with 30-day grace period
router.delete("/workspace", async (req, res) => {
  const companyId = req.user.companyId;
  const userId = req.user.userId;
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: "Password is required for re-authentication." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can request workspace deletions." });
  }

  try {
    const userRes = await pool.query("SELECT password_hash FROM users WHERE id = $1", [userId]);
    const dbUser = userRes.rows[0];
    if (!dbUser) {
      return res.status(401).json({ error: "Re-authentication failed." });
    }
    
    const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Re-authentication failed. Incorrect password." });
    }

    await pool.query(
      "UPDATE companies SET deleted_at = now(), deletion_requested_by = $1 WHERE id = $2",
      [userId, companyId]
    );

    await logAction(companyId, userId, req.user.email, "REQUEST_WORKSPACE_DELETE", `Requested workspace deletion (30-day grace period active)`, req);

    res.json({ success: true, message: "Workspace scheduled for deletion. Access has been disabled." });
  } catch (err) {
    console.error("Workspace soft-delete error:", err);
    res.status(500).json({ error: "Could not schedule workspace deletion." });
  }
});

export default router;
