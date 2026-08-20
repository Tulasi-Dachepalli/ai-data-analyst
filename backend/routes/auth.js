import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool, { logAction } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { TOKEN_QUOTA_LIMIT, TOKEN_QUOTA_WINDOW_HOURS, computeResetTime } from "../lib/quota.js";
import { generateToken, hashToken } from "../lib/tokens.js";
import { sendEmail, verificationEmailHtml, passwordResetEmailHtml, newSignupAlertEmailHtml } from "../lib/email.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNIQUE_VIOLATION = "23505"; // Postgres error code

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, companyId: user.company_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function sendVerificationEmail(userId, email) {
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hash, expiresAt]
  );
  const verifyUrl = `${BACKEND_URL}/api/auth/verify-email?token=${raw}`;
  await sendEmail({ to: email, subject: "Verify your email", html: verificationEmailHtml(verifyUrl) });
}

// POST /api/auth/signup — creates the company on first signup, or joins an
// existing company (matched case-insensitively) as a regular member on
// subsequent signups. Company lookup/creation + user creation run inside a
// single transaction so a mid-flight failure can never leave an orphaned
// company with zero users.
router.post("/signup", async (req, res) => {
  const { companyName, email, password } = req.body || {};
  const inviteToken = req.query.invite;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (!inviteToken && !companyName) {
    return res.status(400).json({ error: "companyName is required to register a new organization." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  let user, company, invite;
  try {
    await client.query("BEGIN");

    // Assert user uniqueness
    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existingUser.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    let role = "member";

    if (inviteToken) {
      const inviteHash = crypto.createHash("sha256").update(inviteToken).digest("hex");
      // Atomic increment & verification check to prevent race conditions
      const inviteRes = await client.query(
        `UPDATE invites 
         SET use_count = use_count + 1 
         WHERE token = $1 AND expires_at > now() AND use_count < max_uses 
         RETURNING *`,
        [inviteHash]
      );
      invite = inviteRes.rows[0];
      if (!invite) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Invalid or expired invitation link." });
      }

      if (invite.email && invite.email.toLowerCase() !== normalizedEmail) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "This invite is only valid for a different email address." });
      }

      // Fetch the company
      const companyRes = await client.query("SELECT * FROM companies WHERE id = $1", [invite.company_id]);
      company = companyRes.rows[0];
      if (!company) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Company workspace no longer exists." });
      }
      if (company.deleted_at) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "This company workspace is scheduled for deletion. Access is disabled." });
      }

      role = invite.role;
    } else {
      // Registering a new organization
      const displayCompanyName = companyName.trim();
      // Collapse duplicate internal spaces to prevent near-identical name creation/spoofing
      const normalizedCompanyName = displayCompanyName.toLowerCase().replace(/\s+/g, ' ');

      // Check if company already exists
      const existingCompany = await client.query(
        "SELECT id FROM companies WHERE name_normalized = $1",
        [normalizedCompanyName]
      );
      if (existingCompany.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "That company workspace already exists. To join it, please ask your administrator for an invitation link." });
      }

      const created = await client.query(
        "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING *",
        [displayCompanyName, normalizedCompanyName]
      );
      company = created.rows[0];
      role = "admin"; // First user becomes admin/owner
    }

    // Insert user (auto-verified)
    const inserted = await client.query(
      "INSERT INTO users (company_id, email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING *",
      [company.id, normalizedEmail, passwordHash, role]
    );
    user = inserted.rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Could not create account." });
  } finally {
    client.release();
  }

  // Log successful event
  if (invite) {
    await logAction(company.id, user.id, user.email, "ACCEPT_INVITE", `Joined workspace via invite code`, req);
  } else {
    await logAction(company.id, user.id, user.email, "SIGNUP_NEW_ORG", `Created and registered new company workspace "${company.name}"`, req);
  }

  // Send instant email notification to creator/admin
  try {
    const adminNotificationEmail = process.env.ADMIN_NOTIFY_EMAIL || "tulasidachepally9393@gmail.com";
    await sendEmail({
      to: adminNotificationEmail,
      subject: `🎉 New User Signup: ${user.email} (${company.name})`,
      html: newSignupAlertEmailHtml(user.email, company.name)
    });
  } catch (notifyErr) {
    console.error("Failed to send admin signup email notification:", notifyErr);
  }

  const token = issueToken(user);
  return res.status(201).json({
    token,
    user: { email: user.email, role: user.role, companyName: company.name, emailVerified: true, tier: company.tier || 'free' }
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  try {
    const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()])).rows[0];
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const company = (await pool.query("SELECT * FROM companies WHERE id = $1", [user.company_id])).rows[0];
    if (company && company.deleted_at) {
      return res.status(403).json({ error: "This workspace is scheduled for deletion. Access is disabled." });
    }
    const token = issueToken(user);
    return res.json({
      token,
      user: { email: user.email, role: user.role, companyName: company?.name || "", emailVerified: user.email_verified, tier: company?.tier || 'free' }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Could not log in." });
  }
});

// GET /api/auth/verify-email?token=... — clicked directly from the emailed
// link, so this returns a small standalone HTML page rather than JSON;
// there's no reason to round-trip through the frontend SPA for this.
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const page = (title, message, ok) => res.status(ok ? 200 : 400).send(`
    <!DOCTYPE html><html><head><title>${title}</title></head>
    <body style="font-family: sans-serif; max-width: 480px; margin: 80px auto; text-align: center; color: #2B2A27;">
      <h2>${title}</h2>
      <p>${message}</p>
      <p><a href="${FRONTEND_URL}">Go to AI Data Analyst</a></p>
    </body></html>
  `);

  if (!token || typeof token !== "string") {
    return page("Invalid link", "This verification link is missing its token.", false);
  }

  const hash = hashToken(token);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atomic claim: this single DELETE...RETURNING either consumes the
    // token and returns exactly one row, or matches nothing — there's no
    // window between "check" and "consume" for a second concurrent request
    // to also claim the same token. Two requests racing on the same token
    // hash can't both succeed, because Postgres serializes the DELETE
    // against that row: whichever commits first removes it, so the second
    // finds nothing to delete.
    const consumed = await client.query(
      `DELETE FROM email_verification_tokens
       WHERE token_hash = $1 AND expires_at > now()
       RETURNING user_id`,
      [hash]
    );

    if (!consumed.rows[0]) {
      await client.query("ROLLBACK");
      // Nothing was consumed — figure out why, purely for a clearer message.
      // This read isn't security-sensitive: no state changes here, so a
      // race on it can produce an imprecise message at worst, never a
      // double-use of the token.
      const stale = await pool.query(
        "SELECT 1 FROM email_verification_tokens WHERE token_hash = $1",
        [hash]
      );
      if (stale.rows[0]) {
        await pool.query(
          "DELETE FROM email_verification_tokens WHERE token_hash = $1 AND expires_at <= now()",
          [hash]
        );
        return page("Link expired", "This verification link has expired. Log in and request a new one.", false);
      }
      return page("Link not valid", "This verification link is invalid or was already used.", false);
    }

    const userId = consumed.rows[0].user_id;
    await client.query("UPDATE users SET email_verified = true WHERE id = $1", [userId]);
    // Any other outstanding verification tokens for this user are now moot.
    await client.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);

    await client.query("COMMIT");
    return page("Email verified", "Your email address has been verified. You can close this tab.", true);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Verify email error:", err);
    return page("Something went wrong", "Please try again later.", false);
  } finally {
    client.release();
  }
});

// POST /api/auth/resend-verification — requires login, since only the
// account owner should be able to trigger a new verification email.
router.post("/resend-verification", requireAuth, async (req, res) => {
  try {
    const user = (await pool.query("SELECT * FROM users WHERE id = $1", [req.user.userId])).rows[0];
    if (!user) return res.status(404).json({ error: "Account not found." });
    if (user.email_verified) return res.json({ alreadyVerified: true });

    await pool.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [user.id]);
    await sendVerificationEmail(user.id, user.email);
    res.json({ sent: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Could not send verification email." });
  }
});

// POST /api/auth/forgot-password — always responds the same way regardless
// of whether the email exists, so this endpoint can't be used to check
// which emails have accounts (a common enumeration vector).
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  const generic = { message: "If an account exists for that email, a reset link has been sent." };
  if (!email || typeof email !== "string") return res.json(generic);

  try {
    const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()])).rows[0];
    if (user) {
      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
      const { raw, hash } = generateToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await pool.query(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
        [user.id, hash, expiresAt]
      );
      const resetUrl = `${FRONTEND_URL}/?reset_token=${raw}`;
      await sendEmail({ to: user.email, subject: "Reset your password", html: passwordResetEmailHtml(resetUrl) });
      await logAction(user.company_id, user.id, user.email, "REQUEST_PASSWORD_RESET", "Requested password reset email link", req);
    }
  } catch (err) {
    console.error("Forgot-password error:", err);
  }
  return res.json(generic);
});

// POST /api/auth/reset-password — body: { token, password }
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Reset token is required." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const hash = hashToken(token);
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const consumed = await client.query(
      `DELETE FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > now()
       RETURNING user_id`,
      [hash]
    );

    if (!consumed.rows[0]) {
      await client.query("ROLLBACK");
      const stale = await pool.query(
        "SELECT 1 FROM password_reset_tokens WHERE token_hash = $1",
        [hash]
      );
      if (stale.rows[0]) {
        await pool.query(
          "DELETE FROM password_reset_tokens WHERE token_hash = $1 AND expires_at <= now()",
          [hash]
        );
        return res.status(400).json({ error: "This reset link has expired. Request a new one." });
      }
      return res.status(400).json({ error: "This reset link is invalid or was already used." });
    }

    const userId = consumed.rows[0].user_id;

    // Fetch user details for compliance logging
    const userRes = await client.query("SELECT email, company_id FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0];

    await client.query(
      "UPDATE users SET password_hash = $1, password_changed_at = now() WHERE id = $2",
      [passwordHash, userId]
    );
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);

    await client.query("COMMIT");

    if (user) {
      await logAction(user.company_id, userId, user.email, "RESET_PASSWORD", "Successfully reset account password", req);
    }

    res.json({ reset: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Reset-password error:", err);
    res.status(500).json({ error: "Could not reset password." });
  } finally {
    client.release();
  }
});

// GET /api/auth/usage — returns current rolling window token usage metrics for the logged-in user's company
router.get("/usage", requireAuth, async (req, res) => {
  try {
    // Query: Fetch all usage records in the last X hours
    const { rows } = await pool.query(
      `SELECT total_tokens, created_at 
       FROM ai_usage 
       WHERE company_id = $1 AND created_at >= now() - make_interval(hours => $2)
       ORDER BY created_at ASC`,
      [req.user.companyId, TOKEN_QUOTA_WINDOW_HOURS]
    );

    let usedTokens = 0;
    for (const row of rows) {
      usedTokens += Number(row.total_tokens || 0);
    }

    const nextResetTime = computeResetTime(rows, usedTokens, TOKEN_QUOTA_LIMIT, TOKEN_QUOTA_WINDOW_HOURS);

    res.json({
      usedTokens,
      limit: req.user.tier === "free" ? TOKEN_QUOTA_LIMIT : null,
      tier: req.user.tier,
      cooldownWindowHours: TOKEN_QUOTA_WINDOW_HOURS,
      nextResetTime: nextResetTime ? nextResetTime.toISOString() : null
    });
  } catch (err) {
    console.error("GET /usage query failed:", err);
    res.status(500).json({ error: "Could not load usage statistics." });
  }
});

export default router;
