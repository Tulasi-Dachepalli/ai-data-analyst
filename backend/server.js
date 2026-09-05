import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import analyzeRouter from "./routes/analyze.js";
import authRouter from "./routes/auth.js";
import datasetsRouter from "./routes/datasets.js";
import adminRouter from "./routes/admin.js";
import { requireAuth, requireAdmin, requireTokenQuota } from "./middleware/auth.js";
import pool, { initDb } from "./db.js";
import { initScheduler } from "./lib/scheduler.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ALLOWED_ORIGIN can be a single origin or a comma-separated list — useful
// in production where you might have a main domain plus preview deployment
// URLs (e.g. Vercel branch previews) that all need to reach this backend.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // No Origin header = same-origin, curl, server-to-server, or Render's
    // own health check — not a browser CORS request, so let it through.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
}));
// Raised from the default 1mb so a company's full dataset (rows + columns +
// stats) can be persisted in one request. Set well above 2x MAX_JSON_LENGTH
// (see routes/datasets.js) since a single request can carry both dataJson
// and messagesJson near their individual caps — this keeps that combination
// hitting our friendlier 413 message instead of Express's generic one.
app.use(express.json({ limit: "30mb" }));

// Tighter limiter for auth endpoints — slows down credential-stuffing / signup spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 signup/login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/auth", authLimiter, authRouter);

// Analysis calls: verify the JWT first, THEN rate-limit per authenticated user
// (not per IP) so one user can't exhaust the quota for everyone behind the
// same office network/NAT.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.userId)
});
app.use("/api/analyze", requireAuth, requireTokenQuota, analyzeLimiter, analyzeRouter);

// Dataset storage: also authenticated and rate-limited per user, but more
// generous since these are plain reads/writes rather than AI calls.
const datasetsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.userId)
});
app.use("/api/datasets", requireAuth, datasetsLimiter, datasetsRouter);

// Admin endpoints: authenticated AND must have role "admin" — enforced on the
// backend regardless of what the frontend shows or hides.
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user.userId)
});
app.use("/api/admin", requireAuth, requireAdmin, adminLimiter, adminRouter);

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    // Return 200 OK so Render health checks do not fail deployment during database cold starts
    res.json({ ok: true, db: "connecting", detail: err.message });
  }
});

// Catches CORS rejections from the origin() callback above and anything else
// that reaches Express's error path — keeps stack traces out of responses.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("not allowed by CORS")) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum allowed size is 10MB." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong." });
});

async function start() {
  if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET environment variable not set, using default production fallback.");
  }
  try {
    await initDb(3, 2000);
    console.log("Database schema ready.");
    initScheduler();
  } catch (err) {
    console.error("Database connection delayed — server starting in resilience mode:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    console.log(`Accepting requests from: ${allowedOrigins.join(", ")}`);
  });
}

start();
