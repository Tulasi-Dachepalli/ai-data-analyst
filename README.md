# AI Data Analyst

A React + Vite chatbot that ingests a CSV/Excel file, computes verified statistics
(data quality score, outliers, correlations), builds a dashboard, and answers
follow-up questions — with Excel and HTML report export.

Users log in under a company account, and every upload, dashboard, and chat
history is persisted server-side, scoped to that company. Admins get a
company-wide dashboard for team and dataset management.

```
User → JWT Authentication → companyId → Dataset → Dashboard Analysis → Chat History → Database
                                  ↓
                          (if role = admin)
                                  ↓
                          Admin Dashboard → Team + Usage
```

Isolation rule enforced on every dataset query, no exceptions:
```
WHERE dataset.company_id = authenticatedUser.companyId
```

## Project structure

```
ai-data-analyst/
├── backend/
│   ├── server.js
│   ├── db.js                  # Postgres pool + schema init: companies, users, datasets
│   ├── Dockerfile              # production image for Render/Fly/Railway/self-host
│   ├── .dockerignore
│   ├── lib/
│   │   ├── email.js            # Resend wrapper (fetch-based, no new dependency) + templates
│   │   └── tokens.js            # random token generation + SHA-256 hashing
│   ├── middleware/
│   │   └── auth.js            # requireAuth (JWT) + requireAdmin (live role check)
│   ├── routes/
│   │   ├── auth.js            # signup/login/verify-email/resend-verification/forgot-password/reset-password
│   │   ├── analyze.js         # /api/analyze (AI calls, requires a valid token, records ai_usage)
│   │   ├── datasets.js        # /api/datasets (CRUD, requires a valid token)
│   │   └── admin.js           # /api/admin/* (requires token + role=admin; includes /usage)
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── src/
│   ├── App.jsx                 # gates the dashboard behind login, routes to Admin
│   ├── AuthPage.jsx            # login / signup screen
│   ├── AdminPage.jsx           # admin dashboard: team + usage
│   ├── DataAnalystDashboardBot.jsx
│   ├── api.js                  # fetch helpers for /api/datasets and /api/admin
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── docker-compose.yml           # local Postgres for development
├── render.yaml                  # Render Blueprint: backend + managed Postgres
├── vercel.json                  # Vercel config for the frontend build
├── RELEASE_CHECKLIST.md         # step-by-step local test before deploying
├── .env.example
└── .gitignore
```

## Setup

Run the backend and frontend in two terminals.

### 1. Database

You need a Postgres instance. Easiest option locally — this repo includes a
`docker-compose.yml`:

```bash
docker compose up -d
```

That starts Postgres on `localhost:5432` with a database called `aida`
(user/password `aida`/`aida`, matching the default `DATABASE_URL` below).
No Docker? Install Postgres locally, or use a free hosted instance
(Neon, Supabase, or Render's free Postgres tier all work) and use the
connection string they give you instead.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
ANTHROPIC_API_KEY=your_api_key_here
JWT_SECRET=          # generate one below
DATABASE_URL=postgresql://aida:aida@localhost:5432/aida
ALLOWED_ORIGIN=http://localhost:5173
PORT=3001
```

Generate a real `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then start it:

```bash
npm run dev
```

On first run, `db.js` runs `CREATE TABLE IF NOT EXISTS` for `companies`,
`users`, and `datasets`, then a small self-healing migration that adds
`companies.name_normalized` if it's missing — there's no separate migration
command to run yourself. You should see `Database schema ready.` in the
logs before the server starts listening.

### 3. Frontend

In a second terminal, from the project root:

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`, sign up or log in, then upload a file.

## Database schema

```sql
companies (
  id SERIAL, name, name_normalized UNIQUE,  -- name keeps original casing for
                                              -- display; name_normalized (lower/
                                              -- trimmed) is the real uniqueness
                                              -- and lookup key, so "Acme Inc",
                                              -- "acme inc", and "ACME INC" all
                                              -- resolve to the same company
  created_at TIMESTAMPTZ
)

users (
  id SERIAL, company_id → companies.id ON DELETE CASCADE,
  email, password_hash, role, email_verified,
  password_changed_at,  -- updated on every reset; requireAuth rejects any
                        -- JWT whose iat predates this (session invalidation)
  created_at TIMESTAMPTZ
)

datasets (
  id SERIAL,
  company_id → companies.id ON DELETE CASCADE,
  created_by → users.id ON DELETE SET NULL,
  name, row_count, column_count, quality_score,
  data_json JSONB,        -- { rows, columns, stats, quality }, written once at upload
  dashboard_json JSONB,    -- { kpis, categoryCharts, trend, distributions,
                            --   outliers, correlations, narrative, quality }
  messages_json JSONB,     -- full chat history array for this dataset
  created_at, updated_at TIMESTAMPTZ
)

ai_usage (
  id SERIAL,
  company_id → companies.id ON DELETE CASCADE,
  user_id → users.id ON DELETE SET NULL,      -- nullable: survives user removal
  dataset_id → datasets.id ON DELETE SET NULL, -- nullable: survives dataset deletion
  request_type,   -- 'overview' | 'dashboard_narrative' | 'chat_plan' | 'chat_narrative'
  input_tokens, output_tokens, total_tokens,
  estimated_cost NUMERIC(12,6),  -- 0 unless CLAUDE_*_COST_PER_MTOK is configured
  created_at TIMESTAMPTZ
)
```

`data_json` is written once at upload time and never changes. `dashboard_json`
and `messages_json` are updated as the dashboard builds and as the user asks
follow-up questions — no new dataset row is ever created for those updates.

Foreign keys are enforced by Postgres (SQLite wasn't enforcing these before):
deleting a company cascades to its users and datasets; removing a user via
the admin panel sets that user's past datasets to `created_by = NULL` instead
of failing or leaving a dangling reference — the UI shows those as
`(removed user)`.

`CHECK` constraints add a database-level backstop behind the existing
application-level validation: `users.role` can only be `'admin'` or
`'member'`; `datasets.quality_score` must be `NULL` or 0–100; row/column
counts can't go negative. These are declared inline on `CREATE TABLE IF NOT
EXISTS`, so they apply automatically to any table created from this schema
version onward — but `CREATE TABLE IF NOT EXISTS` is a no-op against a table
that already exists, so they won't retroactively attach to a `users` or
`datasets` table left over from a database you stood up before this change.
See "Migrating an existing database" below if that applies to you.

**`companies.name_normalized` is self-migrating — this one you don't have to
do by hand.** Every time the server starts, `db.js` runs `ALTER TABLE
companies ADD COLUMN IF NOT EXISTS name_normalized`, backfills it from
`lower(trim(name))` for any row that doesn't have it yet, and only adds the
`UNIQUE` constraint once it confirms there are no collisions. If your
database already had two companies whose names differ only by case or
whitespace (e.g. "Acme Inc" and "acme inc"), the constraint is skipped and a
warning is logged listing exactly which normalized names collide — the
server still starts, but those company names won't get real uniqueness
enforcement until you merge or rename the duplicates and restart.

**Signup is transactional.** Looking up/creating the company and creating
the user happen inside a single `BEGIN...COMMIT` (with `ROLLBACK` on any
error), using a dedicated client from the pool. This closes a real gap: if
company creation succeeded but the subsequent user insert failed for any
reason, you'd otherwise be left with an orphaned company that has zero
users and no way to sign up under it again (since the company name would
already be taken). Now either both rows are created or neither is.

## Migrating an existing database

If you ran an earlier version of this project against a real database
(rather than a fresh one), here's what happens automatically vs. what needs
a manual step:

**Automatic, no action needed:**
- `ai_usage` — an entirely new table, so it's just a `CREATE TABLE IF NOT
  EXISTS` with nothing to backfill; upgrading picks it up on the next
  startup with zero manual steps, same as any brand-new table would.
- `users.email_verified` and `users.password_changed_at` — both added with
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` plus a safe default/backfill on
  every startup; no collision risk like the one below, so these just work.
  Worth knowing: `password_changed_at` backfills from each user's
  `created_at`, not `now()` — this is deliberate (see "Session invalidation"
  above) so upgrading to this version doesn't log everyone out.
- `companies.name_normalized` — added, backfilled, and constrained on next
  startup (see above), *unless* it logs a collision warning, in which case:
  1. Find the duplicates yourself with:
     ```sql
     SELECT lower(trim(name)) AS normalized_name, array_agg(id) AS company_ids, COUNT(*)
     FROM companies
     GROUP BY lower(trim(name))
     HAVING COUNT(*) > 1;
     ```
  2. Decide which company should "win" for each duplicate group, then either
     rename the others (`UPDATE companies SET name = '...' WHERE id = ...`)
     or merge them (reassign the losing company's `users`/`datasets` rows to
     the winner's `id`, then delete the empty company row).
  3. Restart the backend — the migration will detect the collision is gone
     and add the constraint.

**Manual — new tables only get these from `CREATE TABLE`, not retrofitted:**
- If your `users` or `datasets` tables predate this schema version, add the
  `CHECK` constraints yourself:
  ```sql
  ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'member'));

  ALTER TABLE datasets
    ADD CONSTRAINT datasets_row_count_check CHECK (row_count >= 0),
    ADD CONSTRAINT datasets_column_count_check CHECK (column_count >= 0),
    ADD CONSTRAINT datasets_quality_score_check
      CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100);
  ```
  These will fail if existing data already violates them (e.g. a `role`
  value that isn't `'admin'`/`'member'`) — clean up any offending rows first.
- If your `datasets.created_by` was `NOT NULL` (an earlier version of this
  schema had it that way) and you want the "removed user" behavior described
  above, relax it and switch the foreign key's delete action:
  ```sql
  ALTER TABLE datasets ALTER COLUMN created_by DROP NOT NULL;
  ALTER TABLE datasets DROP CONSTRAINT datasets_created_by_fkey;
  ALTER TABLE datasets
    ADD CONSTRAINT datasets_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  ```

If none of this applies to you — you're setting up fresh via
`docker compose up -d` — you can ignore this whole section; every table is
created with the full, current schema from the start.

## API endpoints

| Method | Path                        | Auth | Purpose |
|--------|-----------------------------|------|---------|
| POST   | `/api/auth/signup`          | —    | Create a company (first signup) or join one (matching name), returns a JWT |
| POST   | `/api/auth/login`           | —    | Log in, returns a JWT |
| GET    | `/api/auth/verify-email`    | —    | Clicked from the verification email; confirms the token and returns an HTML page |
| POST   | `/api/auth/resend-verification` | ✅ | Send a new verification email to the logged-in user |
| POST   | `/api/auth/forgot-password` | —    | Request a password reset email (always returns a generic response) |
| POST   | `/api/auth/reset-password`  | —    | Reset password using a valid, unexpired token |
| POST   | `/api/analyze`      | ✅   | Proxies a prompt to Claude (used internally by the dashboard) |
| GET    | `/api/datasets`     | ✅   | List the caller's company's datasets (metadata only) |
| POST   | `/api/datasets`     | ✅   | Create a dataset record right after a file is parsed |
| GET    | `/api/datasets/:id` | ✅   | Fetch the full dataset — rows, stats, dashboard, chat history |
| PUT    | `/api/datasets/:id` | ✅   | Update the dashboard and/or chat history for an existing dataset |
| DELETE | `/api/datasets/:id` | ✅   | Delete a dataset |

Every `:id` route first runs `SELECT ... WHERE id = $1 AND company_id = $2` before
acting, and the mutating statements repeat the same `company_id` check — so a
valid token from Company A can never read, update, or delete Company B's row;
it 404s as if the row didn't exist.

## How persistence flows end-to-end

1. **Upload** — `handleFiles` parses the file client-side, shows it in the UI
   immediately, then calls `POST /api/datasets` once to create the row. The
   returned `serverId` is attached to that thread and reused for every future
   save — no duplicate rows are ever created for the same upload.
2. **Dashboard build** — once computed, `PUT /api/datasets/:id` saves
   `dashboard_json` and the updated `messages_json` together.
3. **Chat** — every question/answer pair (including error and "couldn't parse
   that" replies) calls `PUT /api/datasets/:id` with the updated message list.
4. **Login / refresh** — `DataAnalystDashboardBot` fetches `GET /api/datasets`
   on mount and lists the company's saved datasets (name + counts only, no
   row data, so this stays fast even with many saved files).
5. **Reopening** — clicking an unopened dataset in the sidebar calls
   `GET /api/datasets/:id` on demand, loading its rows, stats, dashboard, and
   chat history, and marks it "loaded" so it won't re-fetch on every click.
6. **Deleting** — the ✕ next to a dataset calls `DELETE /api/datasets/:id`
   after a confirmation prompt.

All persistence calls are fire-and-forget from the UI's perspective — if a
save fails, it's logged to the console but doesn't interrupt the user's
current session (in-memory state stays correct even if the write didn't land).

## What you get

1. Company sign-up / login
2. Upload a CSV or Excel file
3. Automatically generated dashboard
4. Data quality score, outlier detection, correlation analysis
5. Charts and distributions
6. Follow-up Q&A about your data
7. HTML and Excel report export
8. **Datasets, dashboards, and chat history persist across logins/refreshes**
9. **Reopen and keep chatting with any past analysis**

## Security notes carried over from earlier steps

- `ANTHROPIC_API_KEY` and `JWT_SECRET` live only in `backend/.env`.
- CORS is locked to `ALLOWED_ORIGIN`.
- Passwords are bcrypt-hashed.
- Rate limiting is per authenticated user (30/min on `/api/analyze`,
  60/min on `/api/datasets`) plus a stricter per-IP limiter on
  `/api/auth/*` (20 attempts/15min) to slow credential stuffing.
- Every dataset query is scoped by `company_id`, verified before any read,
  write, or delete.

## Admin Dashboard (Step 5)

Users with `role = "admin"` (the first person to register a company) see an
"Admin" button next to Log out. It opens a company-scoped dashboard with:

- **Summary cards** — member count, datasets uploaded, total rows analyzed
- **Team members** — list with role and join date, plus a "Remove" button
  per member (not shown for your own row)
- **Company datasets** — every dataset in the company (not just your own),
  with who uploaded it and when it was last updated

### Admin API endpoints

| Method | Path                        | Purpose |
|--------|-----------------------------|---------|
| GET    | `/api/admin/summary`        | Member count, dataset count, total rows, last activity |
| GET    | `/api/admin/members`        | List of teammates (id, email, role, joined) |
| DELETE | `/api/admin/members/:id`    | Remove a teammate |
| PATCH  | `/api/admin/members/:id`    | Promote a member to admin, or demote an admin to member (body: `{ "role": "admin" \| "member" }`) |
| GET    | `/api/admin/datasets`       | Every company dataset with creator email |
| GET    | `/api/admin/usage`          | AI usage totals, plus breakdowns by user, by dataset, and by day |

All four require a valid token **and** a live `admin` role — enforced by a
`requireAdmin` middleware that runs after `requireAuth` in `server.js`.
`requireAdmin` re-checks the role directly from the database on every
request rather than trusting the role baked into the JWT, so a `member`
calling these endpoints directly (bypassing the UI) gets a `403` regardless
of what the frontend shows — and a demoted admin loses access on their very
next request, not after their token eventually expires.

### Safety rails on member management

- You can't remove or change the role of your own account through these
  endpoints (prevents accidentally locking yourself out).
- You can't remove the last remaining admin, or demote them to member —
  either way, a company can never end up with zero admins.
- Removing someone doesn't delete their previously uploaded datasets — those
  stay with the company and now show `(removed user)` as the uploader.
- Promoting/demoting takes effect **immediately** for admin-gated backend
  routes, since `requireAdmin` checks the current role in the database on
  every request. The one thing that still waits for their next login: the
  frontend's own "Admin" nav button, since it reads `role` out of the
  `user` object cached in `localStorage` at login time. A freshly promoted
  admin won't see the button until they log in again — but if they somehow
  reached an admin action anyway (e.g. a stale tab), the backend would
  correctly allow it, and a freshly demoted admin loses real access
  immediately even though their button might still be visible until refresh.

## AI usage tracking

Every successful `/api/analyze` call is recorded in a new `ai_usage` table —
company_id, user_id, dataset_id, request type, token counts, and an
estimated cost. Admins see it broken down in the dashboard: total
requests/tokens/cost, a 14-day daily bar chart, and per-user and
per-dataset tables.

- **Recorded only on success.** `analyze.js` inserts the usage row after
  confirming the Anthropic response was OK, using the real
  `usage.input_tokens`/`usage.output_tokens` Anthropic returns — not an
  estimate from message length. A failed or errored call never shows up as
  usage, so the numbers reflect what actually happened, not what was
  attempted.
- **Awaited, not fire-and-forget** — the insert happens before the response
  goes back to the user. The DB write is fast relative to the Anthropic
  call that already completed, and this is meant to be a reliable
  record, not a best-effort one. If the insert itself fails, that's logged
  and swallowed (usage tracking is observability, not core functionality —
  a broken usage row should never be the reason someone doesn't get their
  analysis), but a healthy database won't lose rows to a race with the
  response.
- **`request_type` distinguishes what the call was for**, not just that a
  call happened: `overview` (the first-look summary after upload),
  `dashboard_narrative` (the AI text on the generated dashboard),
  `chat_plan` and `chat_narrative` (the two-step process behind each
  follow-up question — one call decides how to answer, a second writes
  the response). Useful for seeing whether usage is dominated by initial
  analysis or ongoing conversation.
- **`user_id` and `dataset_id` are nullable with `ON DELETE SET NULL`** —
  same pattern as `datasets.created_by`. Removing a user or deleting a
  dataset doesn't erase the usage history that happened while they
  existed; the admin view just shows `(removed user)` / `(deleted
  dataset)` for those rows, same convention as elsewhere in this app.

### Cost estimation is opt-in and unconfigured by default

`CLAUDE_INPUT_COST_PER_MTOK` / `CLAUDE_OUTPUT_COST_PER_MTOK` in
`backend/.env` are deliberately left blank rather than pre-filled with a
specific dollar figure — model pricing changes over time, and hardcoding a
number here that might be stale or simply wrong felt worse than being
explicit that you need to check
[anthropic.com/pricing](https://www.anthropic.com/pricing) yourself and
fill these in. Left unset, `estimated_cost` is stored as `0` for every row
— **token counts are still tracked accurately regardless**, since those
come directly from Anthropic's own API response, not from these env vars.
The admin dashboard shows a small note under the cost card if it detects
requests happened but cost is still `$0`, so this doesn't read as "usage
tracking is broken" when it's really just "pricing isn't configured yet."

## Password reset & email verification (Step 6C)

Uses [Resend](https://resend.com) via plain `fetch` — deliberately not the
Resend SDK, so this feature doesn't add anything to the lockfile situation
covered above. No `RESEND_API_KEY` set? Emails are logged to the console
instead of sent, so both flows are fully testable locally without a real
Resend account — just copy the token/link out of the server log.

### Email verification

- On signup, a verification email is sent (best-effort — a failed send
  doesn't fail the signup itself; the user can request another one).
- The emailed link points at the **backend** directly
  (`GET /api/auth/verify-email?token=...`) and returns a small standalone
  HTML confirmation page — there's no reason to round-trip through the
  frontend SPA just to flip a boolean.
- Logged-in users with an unverified email see a dismissible-by-verifying
  banner with a "Resend email" button (`POST /api/auth/resend-verification`,
  requires login).
- **Verification is not required to log in or use the app.** This was a
  deliberate choice, not an oversight: gating login on verification adds
  real complexity (locked-out accounts, "why can't I log in" support
  requests) for a feature whose main purpose here is nudging real email
  ownership, not access control. If you want it to be a hard gate later,
  `requireAuth` would need to check `email_verified` and the datasets/admin
  routes would need to decide whether to block unverified users too.

### Password reset

- `POST /api/auth/forgot-password` — body `{ email }`. **Always returns the
  same generic message** regardless of whether that email has an account,
  so this endpoint can't be used to enumerate which emails are registered.
- `POST /api/auth/reset-password` — body `{ token, password }`. Validates
  the token, updates the password, and deletes the token (and any other
  pending reset tokens for that user) so it can't be reused.
- The emailed link points at the **frontend** (`/?reset_token=...`);
  `AuthPage.jsx` picks up the query param on load, switches straight to a
  "set new password" form, and immediately scrubs the token out of the URL
  via `history.replaceState` so it doesn't linger in browser history.

### Token security details

- Tokens are 32 random bytes (`crypto.randomBytes(32)`), sent to the user
  as the raw hex value, but **only the SHA-256 hash is ever stored** — same
  principle as `password_hash`. A database read alone can't be replayed as
  a valid verification or reset link.
- Verification tokens expire after 24 hours; reset tokens after 1 hour.
  Both are deleted immediately on successful use (one-time use) and also
  deleted (not just left to expire) if a user requests a new one before
  using the old one.
- **Token consumption is atomic**, not "check then use." Both routes
  consume a token with a single `DELETE ... WHERE token_hash = $1 AND
  expires_at > now() RETURNING user_id` — Postgres serializes concurrent
  deletes against the same row, so two requests racing on the same link
  (e.g. an email client prefetching it, or a user double-clicking) can't
  both succeed. Whichever commits first removes the row; the second finds
  nothing to delete and gets a normal "invalid or already used" response.
  An earlier version of this checked validity with a `SELECT` and consumed
  the token with a separate `DELETE` afterward — that gap between the two
  statements was a real (if narrow) window for a token to be used twice.
- **The consume-then-mutate sequence is also wrapped in a transaction**
  (`BEGIN` ... `COMMIT`/`ROLLBACK`, dedicated pooled client, same pattern as
  signup). This isn't a security fix — the atomic `DELETE...RETURNING`
  above already closed the actual race — it's a consistency one: without
  it, a database connection dropping between "consume the token" and
  "update the user" could leave the token gone with the intended change
  never applied. That's recoverable (the user just requests a new
  link/email) but still worth not leaving to chance. The informational
  `SELECT` used only to pick an error message (expired vs. invalid) stays
  outside the transaction on purpose — it doesn't mutate anything, so there's
  nothing for a transaction to protect there.
- **Password resets now invalidate existing sessions immediately** —
  the limitation flagged in earlier steps is closed. `users.password_changed_at`
  is set to `now()` every time a password is reset, and `requireAuth`
  compares every incoming JWT's `iat` (issued-at, built into every JWT by
  default) against it: a token issued before the last password change is
  rejected, no matter how much of its 7-day life is left. See "Session
  invalidation" below for the full design.

### Session invalidation (`password_changed_at`)

Every authenticated request (`/api/analyze`, `/api/datasets/*`,
`/api/admin/*`) now costs one extra database lookup in `requireAuth` — the
direct tradeoff for making this real, not just documented as a gap:

```
requireAuth:
  verify JWT signature/expiry
  SELECT role, password_changed_at FROM users WHERE id = <jwt userId>
  reject (401) if jwt.iat is before password_changed_at
  otherwise: req.user.role is now the live DB value, not the token's
```

- **Why `password_changed_at` over a token-version counter:** no
  version number to increment and keep in sync — resetting the password
  already updates this column as part of the same statement, and it
  compares directly against `iat`, which every JWT already carries with
  zero extra work. It also generalizes for free to a future "log out all
  devices" button, if you ever want one (same column, same check).
- **Self-migrating, and deliberately backfilled from `created_at`, not
  `now()`.** Backfilling with `now()` at migration time would have
  retroactively invalidated every currently-logged-in session the instant
  this shipped — since virtually every existing JWT was issued before
  "right now." Backfilling from `created_at` (when each user's current
  password was actually set) means existing sessions keep working
  normally until they either expire on their own or that user's password
  actually changes.
- **`requireAdmin` got simpler, not more expensive.** It used to run its
  own `SELECT role ...` query to avoid trusting a stale JWT role (Step 5).
  Now that `requireAuth` already fetches `role` fresh on every request,
  `requireAdmin` just reads `req.user.role` — one DB round trip for admin
  routes instead of two.
- **The comparison is done in whole seconds, explicitly** — not mixed
  precision. A JWT's `iat` only has whole-second resolution (that's the
  JWT spec, not a choice made here), while Postgres timestamps carry
  milliseconds. Flooring `password_changed_at` down to whole seconds before
  comparing means the code says what it means, instead of relying on
  `iat`'s lost sub-second precision to happen to produce the right answer.
- **A 5-second clock-skew grace window** is subtracted from the
  comparison. The app server and database server are typically different
  machines; without this, a few seconds of clock drift between them could
  reject a token that was actually issued fine. Five seconds is generous
  enough to absorb realistic skew while still killing a stolen token
  within seconds of a reset, not meaningfully weakening the protection.
- **What this does not (yet) do:** there's still no explicit "log out all
  devices" button, and no way to invalidate a single specific session
  without changing the password — only a password change triggers
  invalidation. Both would be small additions on top of the same column
  if you want them later.

## Deployment (Step 6B)

**Before any of this: run through `RELEASE_CHECKLIST.md` first.** Everything
in this README has been reviewed carefully, but review isn't the same as
watching it actually run — that file is a step-by-step local test (lockfile,
signup, dashboard, admin, and specifically the password-reset/session-
invalidation flow, which is the one thing that genuinely needs a live
process to prove rather than a code read) to work through before deploying
anywhere.

Recommended split: **frontend → Vercel**, **backend → Render**, **database →
Render's managed Postgres** (or Neon/Supabase if you'd rather). The repo
includes config for all of it.

**What this gets you out of the box: a real, working deployment suitable for
a demo, an internal pilot, or testing with a handful of early users — not
yet a setup you'd trust with a real company's production data.** The one
thing standing in the way of that distinction is the database plan (see
the callout in step 1) — everything else (Docker build, health checks,
CORS, auth) is the same regardless of which plan you pick.

### 0. Before you push: generate the backend's lockfile

This repo doesn't ship a `backend/package-lock.json` — it can't be
generated in the environment these files were built in (no registry
access), so this is a one-time step you need to run yourself:

```bash
cd backend
npm install
```

Commit the `package-lock.json` this creates. The Dockerfile already checks
for it (`if [ -f package-lock.json ]; then npm ci ...`), so as soon as it's
present, your builds automatically switch from `npm install` (resolves
`^4.19.2`-style ranges fresh on every build — different builds could pull
in different patch versions) to `npm ci` (installs the exact versions
the lockfile pins, every time). Skipping this step doesn't break anything
today, but it means "what's actually running in production" can drift
between deploys without anyone changing a line of code.

### 1. Database + backend on Render

This repo includes `render.yaml` at the project root — a Render "Blueprint"
that provisions both the database and the backend web service together:

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Render, choose **New > Blueprint** and point it at the repo. Render
   reads `render.yaml` and provisions:
   - A managed Postgres instance (`ai-data-analyst-db`) — **on the free
     plan by default.** That's fine for trying this out, but Render's free
     Postgres has a 1GB cap, expires after 30 days, has no backups, and can
     go temporarily unavailable — genuinely not suitable for real company
     data. Before anyone's actual work depends on this, edit `plan: free` to
     a paid tier in `render.yaml` (or use Neon/Supabase instead, which have
     their own more generous free tiers if you want to delay paying).
   - A web service (`ai-data-analyst-backend`) built from
     `backend/Dockerfile`, with `DATABASE_URL` auto-wired from the database
     above and `JWT_SECRET` auto-generated — you don't set either yourself.
3. After the first deploy, open the backend service's **Environment** tab
   and set the secrets `render.yaml` deliberately leaves blank:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `ALLOWED_ORIGIN` — your frontend's URL once you have it from step 2
     below (you'll circle back and set this after deploying the frontend)
   - `BACKEND_URL` — this service's own public URL (see step 5) — used to
     build the link in verification emails
   - If you want real password-reset/verification emails rather than
     console logs (Step 6C): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
     `FRONTEND_URL` (your Vercel URL from step 2, used to build reset links)
4. Render's health check is already pointed at `/health` (`healthCheckPath`
   in `render.yaml`), which checks the real Postgres connection, not just
   "is the process alive" — a stuck DB connection will correctly show as
   unhealthy instead of a false green light.
5. Note the backend's public URL (e.g.
   `https://ai-data-analyst-backend.onrender.com`) — you'll need it next.

No Render Blueprint? You can also create the web service manually: point it
at `backend/Dockerfile` (or use Render's native Node runtime with build
command `npm install` and start command `npm start`), and create a
Postgres instance separately, then paste its connection string into
`DATABASE_URL` yourself.

### 2. Frontend on Vercel

`vercel.json` at the project root tells Vercel this is a Vite app:

1. Import the repo into Vercel (**New Project**).
2. In the project's environment variables, set:
   ```
   VITE_API_BASE_URL=https://ai-data-analyst-backend.onrender.com
   ```
   (your actual Render backend URL from step 1)
3. Deploy. Vercel runs `npm run build` and serves `dist/` as static files —
   there's no server-side piece to configure on this side.
4. Note the frontend's URL (e.g. `https://ai-data-analyst.vercel.app`).

### 3. Close the loop: CORS

Go back to the Render backend's environment variables and set:
```
ALLOWED_ORIGIN=https://ai-data-analyst.vercel.app
```
Comma-separate multiple values if you also want a staging URL or a custom
domain to work, e.g.:
```
ALLOWED_ORIGIN=https://ai-data-analyst.vercel.app,https://app.yourcompany.com
```
Redeploy the backend (or it may pick up the env change automatically,
depending on your Render settings) — until this matches your real frontend
origin, the browser will block every request with a CORS error, even
though the backend itself is healthy.

### Production environment variables — full list

**Backend** (`backend/.env` locally, or Render's Environment tab in prod):

| Variable | Local dev example | Production |
|---|---|---|
| `ANTHROPIC_API_KEY` | your key | your key (set manually — never auto-generated) |
| `JWT_SECRET` | generated once, put in `.env` | auto-generated by `render.yaml` |
| `DATABASE_URL` | `postgresql://aida:aida@localhost:5432/aida` | auto-wired by `render.yaml` from the Render Postgres instance |
| `PGSSL` | unset (auto-detects off for localhost) | `true` (set by `render.yaml`; Render Postgres requires TLS) |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | your Vercel URL(s), comma-separated if more than one |
| `PORT` | `3001` | `3001` (Render sets its own `PORT` too; Express reads whichever is present) |
| `RESEND_API_KEY` | unset (emails log to console) | your Resend API key — **not set by `render.yaml`, add it yourself** |
| `RESEND_FROM_EMAIL` | Resend's shared test sender | a domain you've verified in Resend |
| `FRONTEND_URL` | `http://localhost:5173` | your Vercel URL — used to build the password-reset link |
| `BACKEND_URL` | `http://localhost:3001` | your Render backend's public URL — used to build the verify-email link |

**Frontend** (`.env` locally, or Vercel's project environment variables):

| Variable | Local dev | Production |
|---|---|---|
| `VITE_API_BASE_URL` | unset (Vite dev proxy handles `/api/*`) | your Render backend's public URL |

### CORS in production

`server.js` parses `ALLOWED_ORIGIN` as a comma-separated list and validates
each incoming request's `Origin` header against it via a custom `cors()`
origin function, rather than a single fixed string — this is what lets you
list a production domain plus preview/staging URLs. Requests with no
`Origin` header at all (curl, server-to-server calls, Render's own health
checks) are allowed through, since those aren't browser CORS requests to
begin with. Anything from an origin not on the list gets a clean `403` via
a dedicated error-handling middleware — not a raw stack trace.

### Health check

`GET /health` actually queries the database (`SELECT 1`) rather than just
confirming the Node process is running — it returns `503` if the database
is unreachable. Render's Blueprint points its health check here, so a
backend that's "up" but can't reach Postgres gets correctly marked
unhealthy instead of silently serving broken requests.

### Local build/preview commands

```bash
# frontend
npm run build
npm run preview

# backend
cd backend
npm start
```

## Known gaps / good next steps

- **No password reset / email verification flow yet.**
- **Row data is stored as JSON (JSONB) in Postgres**, which is simple and
  queryable but not efficient for very large files (tens of MB+). A
  production version at real scale would move raw file storage to object
  storage (e.g. S3) and keep only metadata and computed stats in the
  database.
- **No connection pooling limits configured** — the default `pg.Pool` caps
  concurrent connections at 10. This matters somewhat more now than it used
  to: session invalidation means every authenticated request runs a query
  in `requireAuth`, not just admin routes. Still fine at this scale; revisit
  sooner rather than later if you deploy multiple backend instances against
  the same database, or if traffic grows enough that 10 connections start
  queuing.
- **No migration tool** — schema changes currently rely on `CREATE TABLE IF
  NOT EXISTS` in `db.js` plus the one hand-written migration in
  `migrateCompanyNameNormalized()`. That pattern doesn't scale past a
  handful of ad hoc migrations — if you add more schema changes after this,
  a real migration tool (e.g. `node-pg-migrate` or Prisma Migrate) is worth
  adopting rather than hand-writing another one-off function.
- **Render's free tier spins down on inactivity** — the first request after
  idle can take 30-60s while the instance cold-starts, which will also delay
  `initDb()` running again (harmless — it's idempotent — just slow). Fine
  for a demo; upgrade the plan if you need consistent response times.
