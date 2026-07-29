# Release validation checklist

Everything below has been reviewed line-by-line, but none of it has been
run as a live process — this sandbox has no network access, no Postgres
binary, and no way to actually click through the app. This checklist is
the thing that closes that gap. Work through it in order; each section
assumes the previous one passed.

Check boxes as you go. If something fails, note what you saw — that's
usually enough to tell us exactly which file to look at.

## 0. Lockfile (one-time, blocks the Docker build)

- [ ] `cd backend && npm install`
- [ ] `backend/package-lock.json` now exists
- [ ] Commit it
- [ ] Confirm the Dockerfile picks it up: `cd backend && docker build -t aida-backend-test .`
      should print `npm ci` in the build log, not `npm install` (see the
      `if [ -f package-lock.json ]` line in `backend/Dockerfile`)

## 1. Local database + backend boot

- [ ] `docker compose up -d` (from project root) — starts Postgres on `:5432`
- [ ] `cd backend && cp .env.example .env`, fill in `ANTHROPIC_API_KEY` and a
      real `JWT_SECRET` (the `node -e "console.log(require('crypto')...)"`
      one-liner in the README), leave `RESEND_API_KEY` blank for now
- [ ] `npm install && npm run dev`
- [ ] Console shows `Database schema ready.` **before** `Backend listening on...`
- [ ] `curl http://localhost:3001/health` returns `{"ok":true,"db":"connected"}`

## 2. Frontend boot

- [ ] `cp .env.example .env` (root), leave `VITE_API_BASE_URL` unset
- [ ] `npm install && npm run dev`
- [ ] Open `http://localhost:5173` — should land on the login/signup screen,
      no CORS errors in the browser console

## 3. Signup, company creation, email verification

- [ ] Sign up as `admin@test.com` with a new company name — succeeds,
      lands on the dashboard
- [ ] Confirm the unverified-email banner is visible
- [ ] Backend console logs a verification email (since `RESEND_API_KEY` is
      unset) — find the `verify-email?token=...` link in the log
- [ ] Open that link in a browser — shows the "Email verified" HTML page
- [ ] Refresh the app — the unverified-email banner is now gone
- [ ] Sign up a second user (`member@test.com`) with the **same company
      name** — succeeds as a `member`, not a new company
- [ ] Log in as `admin@test.com`, open Admin — both users appear under
      "Team members" with correct roles

## 4. Core dashboard flow

- [ ] Upload a CSV or Excel file with a mix of numeric/categorical/date columns
- [ ] Dashboard builds: quality score, KPIs, category charts, trend (if a
      date column exists), distributions, outliers, correlations
- [ ] Ask a follow-up question in chat — get a sensible answer, chart
      appears if relevant
- [ ] Download both the HTML report and the Excel report — both open and
      contain real data
- [ ] Refresh the page — the dataset reappears in the sidebar (shows
      dimmed/unloaded until clicked)
- [ ] Click it — full dashboard and chat history reload correctly
- [ ] Delete a dataset — disappears from the sidebar and from Admin's
      "Company datasets" table

## 5. Admin — usage tracking

- [ ] Admin dashboard's "AI usage" cards show non-zero requests/tokens
      after the steps above
- [ ] Estimated cost shows `$0.00` with the "pricing isn't configured"
      note (expected, since `CLAUDE_*_COST_PER_MTOK` is blank) — fill
      those in and repeat a request to confirm cost becomes non-zero
- [ ] "Usage by user" and "Usage by dataset" tables show the right rows
- [ ] The 14-day bar chart renders (even if it's just one day's bar so far)

## 6. Admin — roles and removal safety rails

- [ ] As admin, promote `member@test.com` to admin — succeeds
- [ ] Log in as `member@test.com` in a different browser/incognito window
      — they can now see and use the Admin button (after logging in fresh,
      per the documented limitation — role only refreshes in the frontend
      nav on next login, though the backend already enforces it live)
- [ ] Try to demote yourself, or remove yourself — both correctly blocked
- [ ] Demote `member@test.com` back to member — succeeds (you're not the
      last admin)
- [ ] Try removing the last remaining admin — correctly blocked

## 7. Password reset + session invalidation (the one that actually needs a live process to prove)

This is the sequence worth being deliberate about — it's the one thing
that was reviewed carefully in code but never watched happen:

- [ ] Log in as `admin@test.com` in **Tab A**. Confirm you can load the
      dashboard (proves the current JWT works).
- [ ] In **Tab B** (or an incognito window), go to the login screen, click
      "Forgot password?", submit `admin@test.com`'s email
- [ ] Backend console logs the reset email — grab the `reset_token=...` link
- [ ] Open that link — lands on "set new password," submit a new password
      — succeeds, redirects to login
- [ ] **Back in Tab A**, without logging out, click anything that hits the
      backend (upload a file, ask a question, open Admin). It should fail
      with a 401 / "Your session has expired" — **this is the proof that
      session invalidation actually works**, not just that the code looks
      right.
- [ ] Log in fresh in Tab A with the new password — works

## 8. Rate limiting (optional, only if you want to confirm it fires)

- [ ] Hit `/api/auth/login` with a wrong password ~21 times quickly — the
      21st should get a `429` before it gets a `401`

## 9. Once all of the above passes

- [ ] Move to the README's "Deployment (Step 6B)" section: Render Blueprint
      for backend + Postgres, Vercel for frontend
- [ ] Before any real company data goes in: change `plan: free` to a paid
      tier in `render.yaml` for the database (see the callout right next
      to it)
- [ ] Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` in Render once you want
      real emails instead of console-logged ones
