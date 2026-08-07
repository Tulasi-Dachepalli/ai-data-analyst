import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — see backend/.env.example.");
}

// Local Postgres (e.g. via docker-compose) doesn't need SSL; most hosted
// providers (Render, Neon, Supabase, RDS) require it. Toggle with PGSSL if
// your provider needs something different than this default.
const useSSL = process.env.PGSSL === "false"
  ? false
  : process.env.PGSSL === "true"
    ? { rejectUnauthorized: false }
    : !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => {
  // Errors on idle clients in the pool (e.g. connection dropped) — don't
  // crash the whole server over a single bad connection.
  console.error("Unexpected Postgres pool error:", err);
});

export async function initDb() {
  // Base tables. Deliberately does NOT declare name_normalized inline on
  // companies — that's added by migrateCompanyNameNormalized() below, which
  // runs the same way whether companies is brand new or pre-existing, so
  // there's exactly one code path instead of "fresh install" vs "upgrade"
  // behaving differently.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS datasets (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
      column_count INTEGER NOT NULL DEFAULT 0 CHECK (column_count >= 0),
      quality_score INTEGER CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100),
      data_json JSONB NOT NULL,
      dashboard_json JSONB,
      messages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Tokens are stored as a SHA-256 hash, never the raw value that goes out
    -- in the email — same principle as password_hash, so a DB read alone
    -- can't be used to verify an email or reset a password.
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- One row per successful Anthropic API call. user_id/dataset_id are
    -- nullable with ON DELETE SET NULL — same pattern as datasets.created_by
    -- — so removing a user or deleting a dataset doesn't erase the usage
    -- history that happened while they existed; it just loses the label,
    -- same as "(removed user)" elsewhere in this app.
    CREATE TABLE IF NOT EXISTS ai_usage (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      dataset_id INTEGER REFERENCES datasets(id) ON DELETE SET NULL,
      request_type TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
      output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
      total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
      estimated_cost NUMERIC(12, 6) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_datasets_company ON datasets(company_id);
    CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
    CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_company ON ai_usage(company_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_dataset ON ai_usage(dataset_id);
  `);

  // Simple self-migration: a fresh boolean column with a DEFAULT and no
  // collision risk, unlike name_normalized — safe to just always run.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true;`);
  // Backfill existing users to be verified automatically
  await pool.query(`UPDATE users SET email_verified = true WHERE email_verified = false;`);

  // Migrate ai_usage.dataset_id to CASCADE on delete so deleting a dataset removes its usage records
  await pool.query(`
    ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_dataset_id_fkey;
    ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_dataset_id_fkey 
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  `);

  await migratePasswordChangedAt();
  await migrateCompanyNameNormalized();
}

// Backs the session-invalidation check in requireAuth: a JWT issued before
// the user's password was last changed is rejected. Backfills existing rows
// with created_at (when their current password was actually set), NOT
// now() — backfilling with now() would retroactively invalidate every
// currently-logged-in session the moment this migration runs, since almost
// all of them were issued before "now". Backfilling with created_at means
// only sessions that predate account creation (impossible) would be
// affected, so existing sessions keep working until their normal 7-day
// expiry or an actual password change.
async function migratePasswordChangedAt() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;`);
  await pool.query(`
    UPDATE users
    SET password_changed_at = created_at
    WHERE password_changed_at IS NULL;
  `);
  await pool.query(`ALTER TABLE users ALTER COLUMN password_changed_at SET NOT NULL;`);
  await pool.query(`ALTER TABLE users ALTER COLUMN password_changed_at SET DEFAULT now();`);
}

// Idempotent, self-healing migration: adds companies.name_normalized if it's
// missing, backfills it for any existing rows, and only locks in NOT NULL +
// UNIQUE once it's confirmed collision-free. Safe to run on every startup —
// on a table that's already fully migrated, every step here is a no-op.
async function migrateCompanyNameNormalized() {
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_normalized TEXT;`);

  await pool.query(`
    UPDATE companies
    SET name_normalized = lower(trim(name))
    WHERE name_normalized IS NULL;
  `);

  const dupes = await pool.query(`
    SELECT name_normalized, COUNT(*)::int AS n
    FROM companies
    GROUP BY name_normalized
    HAVING COUNT(*) > 1
  `);

  if (dupes.rows.length > 0) {
    const list = dupes.rows.map(r => `"${r.name_normalized}" (${r.n} companies)`).join(", ");
    console.warn(
      `⚠ companies.name_normalized has collisions and will NOT get its UNIQUE constraint yet: ${list}`
    );
    console.warn(
      "  Merge or rename the colliding companies, then restart the server to finish this migration. " +
      "See README > 'Migrating an existing database'."
    );
    return; // leave nullable / unconstrained until the operator resolves the collision
  }

  await pool.query(`ALTER TABLE companies ALTER COLUMN name_normalized SET NOT NULL;`);

  const constraintExists = await pool.query(`
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_name_normalized_key'
  `);
  if (!constraintExists.rows[0]) {
    await pool.query(`
      ALTER TABLE companies
      ADD CONSTRAINT companies_name_normalized_key UNIQUE (name_normalized);
    `);
  }
}

export default pool;
