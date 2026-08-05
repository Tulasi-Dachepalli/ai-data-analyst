import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { generateToken, hashToken } from "../lib/tokens.js";
import { sendEmail, verificationEmailHtml, passwordResetEmailHtml } from "../lib/email.js";

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

  if (!companyName || !email || !password) {
    return res.status(400).json({ error: "companyName, email, and password are all required." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const normalizedEmail = email.toLowerCase();
  const displayCompanyName = companyName.trim();
  const normalizedCompanyName = displayCompanyName.toLowerCase();
  // Hash outside the transaction — it's CPU-bound and doesn't touch the DB,
  // so there's no reason to hold a transaction/lock open while it runs.
  const passwordHash = bcrypt.hashSync(password, 10);

  const client = await pool.connect();
  let user, company;
  try {
    await client.query("BEGIN");

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existingUser.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    company = (await client.query(
      "SELECT * FROM companies WHERE name_normalized = $1",
      [normalizedCompanyName]
    )).rows[0];
    let role = "member";
    if (!company) {
      const created = await client.query(
        "INSERT INTO companies (name, name_normalized) VALUES ($1, $2) RETURNING *",
        [displayCompanyName, normalizedCompanyName]
      );
      company = created.rows[0];
      role = "admin"; // first person to register a company becomes its admin
    }

    const inserted = await client.query(
      "INSERT INTO users (company_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
      [company.id, normalizedEmail, passwordHash, role]
    );
    user = inserted.rows[0];

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err.code === UNIQUE_VIOLATION) {
      if (err.constraint === "companies_name_normalized_key") {
        return res.status(409).json({ error: "That company name was just taken — try signing up again." });
      }
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Could not create account." });
  } finally {
    client.release();
  }

  // Best-effort: a failed verification email shouldn't fail the signup
  // itself — the user can request another one via /resend-verification.
  try {
    await sendVerificationEmail(user.id, user.email);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

  const token = issueToken(user);
  return res.status(201).json({
    token,
    user: { email: user.email, role: user.role, companyName: company.name, emailVerified: false }
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = (await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()])).rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    const company = (await pool.query("SELECT * FROM companies WHERE id = $1", [user.company_id])).rows[0];
    const token = issueToken(user);
    return res.json({
      token,
      user: { email: user.email, role: user.role, companyName: company?.name || "", emailVerified: user.email_verified }
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
    }
  } catch (err) {
    console.error("Forgot-password error:", err);
    // Still return the generic response — don't leak whether something broke
    // for a specific email vs. it simply not existing.
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
  // Hash the new password before opening the transaction — it's CPU-bound
  // and doesn't touch the DB, no reason to hold a transaction open for it.
  const passwordHash = bcrypt.hashSync(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Same atomic-claim pattern as verify-email above: this DELETE either
    // consumes the token and returns the owning user, or matches nothing —
    // no gap between checking validity and consuming it for a second
    // concurrent request to slip through.
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
    await client.query(
      "UPDATE users SET password_hash = $1, password_changed_at = now() WHERE id = $2",
      [passwordHash, userId]
    );
    // Any other pending reset tokens for this user are now moot too.
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);

    await client.query("COMMIT");
    res.json({ reset: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Reset-password error:", err);
    res.status(500).json({ error: "Could not reset password." });
  } finally {
    client.release();
  }
});

export default router;
