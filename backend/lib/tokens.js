import crypto from "crypto";

// Raw token goes out in the email link; only its hash is ever stored, so a
// database read alone can't be replayed as a valid verification/reset link.
export function generateToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
