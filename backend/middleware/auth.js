import jwt from "jsonwebtoken";
import pool from "../db.js";
import { TOKEN_QUOTA_LIMIT, TOKEN_QUOTA_WINDOW_HOURS, PRO_QUOTA_WINDOW_HOURS, computeResetTime } from "../lib/quota.js";

// Every authenticated request now costs one extra DB lookup — that's the
// direct tradeoff for making session invalidation real. Before this, a
// stolen or leaked JWT stayed valid for its full 7-day life even after a
// password reset; now it dies on the very next request after that reset.
// This also means requireAdmin (below) no longer needs its own DB round
// trip for role — it reads req.user.role, refreshed here already.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set on the server.");
    return res.status(500).json({ error: "Server is misconfigured." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  try {
    // Single query fetches role, companyId, password status, company soft-delete status, and subscription tier
    const { rows } = await pool.query(
      `SELECT u.role, u.company_id, u.password_changed_at, c.deleted_at, c.tier
       FROM users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.id = $1`,
      [payload.userId]
    );
    const dbUser = rows[0];
    if (!dbUser) {
      return res.status(401).json({ error: "This account no longer exists." });
    }
    if (dbUser.deleted_at) {
      return res.status(403).json({ error: "This workspace has been scheduled for deletion. Access is disabled." });
    }

    // Assert that the user's current database company matches the JWT payload's company context
    if (dbUser.company_id !== payload.companyId) {
      return res.status(401).json({ error: "Your workspace authorization has changed — please log in again." });
    }

    if (dbUser.password_changed_at) {
      const CLOCK_SKEW_GRACE_SECONDS = 5;
      const issuedAtSeconds = Number(payload.iat);
      const changedAtSeconds = Math.floor(new Date(dbUser.password_changed_at).getTime() / 1000);
      if (issuedAtSeconds && !isNaN(changedAtSeconds) && issuedAtSeconds < changedAtSeconds - CLOCK_SKEW_GRACE_SECONDS) {
        return res.status(401).json({ error: "Your session has expired — please log in again." });
      }
    }

    // Build req.user entirely from database properties, not trusting state from the client token
    req.user = {
      userId: payload.userId,
      email: payload.email,
      companyId: dbUser.company_id,
      role: dbUser.role,
      tier: dbUser.tier || "free"
    };
    next();
  } catch (err) {
    console.error("requireAuth session check failed:", err);
    return res.status(500).json({ error: "Could not verify session." });
  }
}

// Must run AFTER requireAuth. req.user.role is already fresh from the
// database check above (not the possibly-stale JWT), so this is just a
// role check now — no separate DB round trip needed here anymore.
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

/**
 * Middleware to enforce the rolling token quota limit.
 * - enterprise: fully unlimited (bypass)
 * - pro: 50,000 tokens per 1-hour rolling window
 * - free: 50,000 tokens per 3-hour rolling window
 */
export async function requireTokenQuota(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Missing session context." });
  }

  // Enterprise accounts are completely unlimited
  if (req.user.tier === "enterprise") {
    return next();
  }

  // Choose window length based on tier
  const windowHours = req.user.tier === "pro" ? PRO_QUOTA_WINDOW_HOURS : TOKEN_QUOTA_WINDOW_HOURS;
  const tierLabel = req.user.tier === "pro" ? "Pro (1-hour window)" : "Free (3-hour window)";

  try {
    // Single Query: Fetch all usage records in the rolling window
    const { rows } = await pool.query(
      `SELECT total_tokens, created_at 
       FROM ai_usage 
       WHERE company_id = $1 AND created_at >= now() - make_interval(hours => $2)
       ORDER BY created_at ASC`,
      [req.user.companyId, windowHours]
    );

    let usedTokens = 0;
    for (const row of rows) {
      usedTokens += Number(row.total_tokens || 0);
    }

    // Inclusive boundary check: >= limit blocks access
    if (usedTokens >= TOKEN_QUOTA_LIMIT) {
      const nextResetTime = computeResetTime(rows, usedTokens, TOKEN_QUOTA_LIMIT, windowHours);
      const remainingSeconds = nextResetTime 
        ? Math.max(0, Math.ceil((nextResetTime.getTime() - Date.now()) / 1000))
        : 0;

      res.setHeader("Retry-After", String(remainingSeconds));
      return res.status(402).json({
        error: "TOKEN_QUOTA_EXCEEDED",
        message: `Your account has used ${usedTokens.toLocaleString()} / ${TOKEN_QUOTA_LIMIT.toLocaleString()} tokens in the last ${windowHours} hour${windowHours === 1 ? "" : "s"} (${tierLabel}). Please wait or upgrade to continue.`,
        nextResetTime: nextResetTime ? nextResetTime.toISOString() : null
      });
    }

    next();
  } catch (err) {
    console.error("requireTokenQuota check failed:", err);
    return res.status(500).json({ error: "Could not verify usage limit." });
  }
}
