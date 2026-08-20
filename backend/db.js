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
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  keepAlive: true
});

pool.on("error", (err) => {
  // Errors on idle clients in the pool (e.g. connection dropped) — don't
  // crash the whole server over a single bad connection.
  console.error("Unexpected Postgres pool error:", err);
});

export async function initDb(retries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Initializing database schema (attempt ${attempt}/${retries})...`);
      await runSchemaQueries();
      console.log("Database schema initialized successfully.");
      return;
    } catch (err) {
      console.error(`Database initialization attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      console.log(`Retrying database connection in ${delayMs / 1000}s...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

async function runSchemaQueries() {
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

  // Add subscription tier to companies table
  await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';`);

  // Migrate ai_usage.dataset_id to CASCADE on delete so deleting a dataset removes its usage records
  await pool.query(`
    ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_dataset_id_fkey;
    ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_dataset_id_fkey 
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  `);

  // Create audit_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id),
      user_id INTEGER,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id, created_at DESC);
  `);

  // Migration: Add foreign key constraint to audit_logs if it does not exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_company') THEN
        ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_company FOREIGN KEY (company_id) REFERENCES companies(id);
      END IF;
    END;
    $$;
  `);

  // Revoke write privileges for standard app database roles (defense in depth)
  await pool.query(`
    REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;
  `);

  // Drop legacy rules if they exist
  await pool.query(`
    DROP RULE IF EXISTS audit_logs_no_update ON audit_logs;
    DROP RULE IF EXISTS audit_logs_no_delete ON audit_logs;
  `);

  // Implement write-blocking triggers on audit_logs table
  await pool.query(`
    CREATE OR REPLACE FUNCTION audit_logs_block_write() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs table is append-only: % operation is prohibited.', TG_OP;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs;
    CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_block_write();
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS audit_logs_no_delete ON audit_logs;
    CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION audit_logs_block_write();
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS audit_logs_no_truncate ON audit_logs;
    CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
    FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_block_write();
  `);

  // Create invites table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invites (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      max_uses INTEGER NOT NULL DEFAULT 1,
      use_count INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
    CREATE INDEX IF NOT EXISTS idx_invites_company ON invites(company_id);
    CREATE INDEX IF NOT EXISTS idx_datasets_company_updated ON datasets(company_id, updated_at DESC);

    CREATE TABLE IF NOT EXISTS ml_models (
      id SERIAL PRIMARY KEY,
      dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      task_type TEXT NOT NULL,
      target_column TEXT,
      algorithm TEXT NOT NULL,
      metrics JSONB NOT NULL,
      feature_columns JSONB NOT NULL,
      training_rows INTEGER NOT NULL,
      model_path TEXT NOT NULL,
      model_version INTEGER NOT NULL DEFAULT 1,
      framework_version TEXT NOT NULL,
      random_state INTEGER NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_ml_models_company ON ml_models(company_id);
    CREATE INDEX IF NOT EXISTS idx_ml_models_dataset ON ml_models(dataset_id);

    CREATE TABLE IF NOT EXISTS forecast_models (
      id SERIAL PRIMARY KEY,
      dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      date_column TEXT NOT NULL,
      target_column TEXT NOT NULL,
      frequency TEXT NOT NULL,
      algorithm TEXT NOT NULL,
      parameters JSONB NOT NULL,
      metrics JSONB NOT NULL,
      forecast_horizon INTEGER NOT NULL,
      training_rows INTEGER NOT NULL,
      validation_rows INTEGER NOT NULL,
      seasonal_period INTEGER,
      training_start TIMESTAMPTZ,
      training_end TIMESTAMPTZ,
      model_path TEXT NOT NULL,
      model_version INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_forecast_models_company ON forecast_models(company_id);
    CREATE INDEX IF NOT EXISTS idx_forecast_models_dataset ON forecast_models(dataset_id);
  `);

  // Add soft-delete flag columns to companies
  await pool.query(`
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS deletion_requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  `);

  await migratePasswordChangedAt();
  await migrateCompanyNameNormalized();
}

export async function logAction(companyId, userId, email, action, target, req) {
  try {
    const rawIp = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress) : null;
    // Format IP address for logs
    const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : rawIp;
    const ua = req ? req.headers["user-agent"] : null;
    await pool.query(
      `INSERT INTO audit_logs (company_id, user_id, user_email, action, target, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [companyId, userId, email, action, target, ip, ua]
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
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
