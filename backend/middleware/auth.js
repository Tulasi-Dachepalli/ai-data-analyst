import jwt from "jsonwebtoken";
import pool from "../db.js";

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
    const { rows } = await pool.query(
      "SELECT role, password_changed_at FROM users WHERE id = $1",
      [payload.userId]
    );
    const dbUser = rows[0];
    if (!dbUser) {
      return res.status(401).json({ error: "This account no longer exists." });
    }

    // jwt's `iat` only has whole-second precision (it's seconds since
    // epoch, per the JWT spec), while password_changed_at is a real
    // Postgres timestamp with millisecond precision. Comparing in
    // milliseconds mixes two different precisions — floor the DB timestamp
    // down to whole seconds first so the comparison is explicit about what
    // it's actually comparing, rather than relying on iat's lost
    // sub-second precision to happen to work out. A JWT issued before the
    // most recent password change is a session from before that change and
    // should not still work, regardless of its own expiry. A small grace
    // window absorbs minor clock skew between the app server and the
    // database server (typically different machines) without meaningfully
    // weakening the invalidation — a stolen token still dies within
    // seconds of a reset, not days.
    const CLOCK_SKEW_GRACE_SECONDS = 5;
    const issuedAtSeconds = Number(payload.iat);
    const changedAtSeconds = Math.floor(new Date(dbUser.password_changed_at).getTime() / 1000);
    if (issuedAtSeconds < changedAtSeconds - CLOCK_SKEW_GRACE_SECONDS) {
      return res.status(401).json({ error: "Your session has expired — please log in again." });
    }

    req.user = { ...payload, role: dbUser.role }; // role read fresh, not trusted from the token
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
