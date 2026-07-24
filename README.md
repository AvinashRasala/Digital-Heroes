# LeadDesk Mini

A small lead-capture tool: a public form, a real database, and an authenticated
admin dashboard to triage submissions. Built for the Digital Heroes Full Stack
Development internship task.

**Live demo:** [add your deployed URL here]
**Admin login:** [add your deployed URL]/admin — test credentials in submission notes

---

## Stack

- **Backend:** Node.js + Express
- **Database:** SQLite, via Node's built-in `node:sqlite` module (no native
  compilation, no external DB service — just a file on disk)
- **Auth:** `express-session` (server-side sessions) + `bcryptjs` for password hashing
- **Frontend:** vanilla HTML/CSS/JS — no framework, to keep the moving parts
  visible and easy to walk through

## Data model

Two tables:

```sql
leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  budget_range  TEXT NOT NULL,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Contacted','Closed')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
)

admins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL
)
```

`budget_range` is stored as text against a fixed set of options (`<$1k`,
`$1k-$5k`, `$5k-$20k`, `$20k+`) rather than a numeric range, because the form
asks for a bracket, not an exact figure — storing it as free numbers would
imply precision that isn't there. `status` uses a `CHECK` constraint instead
of trusting the application layer alone, so a bad value can't get into the
database even if a bug slips through validation.

## Auth approach

Admin credentials are seeded once via `node seed.js`, which reads
`ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` and stores a **bcrypt hash** —
never the plaintext password — in the `admins` table. There is no hardcoded
password anywhere in the source.

Login issues a server-side session (`express-session`), and the session ID is
stored in an `httpOnly` cookie. `httpOnly` matters here: it means the cookie
is invisible to any JavaScript running on the page, so a stray XSS bug
couldn't be used to steal the session.

Every admin route (`GET /api/admin/leads`, `PATCH /api/admin/leads/:id/status`)
is gated by a `requireAuth` middleware that checks `req.session.adminId`. The
`/admin` page itself is also gated **server-side** (not just by hiding a link
on the frontend) — visiting `/admin` without a session redirects to the login
page before any admin HTML is ever sent to the browser.

## Design decision: why `node:sqlite` over `better-sqlite3`

`better-sqlite3` needs a native build step (`node-gyp`), which is a common
source of "works on my machine, fails on deploy" pain, especially on
constrained free-tier hosts. Node 22+ ships a built-in SQLite module
(`node:sqlite`) that needs no compilation and no extra dependency — one less
thing to break in front of a reviewer. It's still marked experimental by
Node, which is a real tradeoff worth knowing about, but for a small
single-writer app like this it's a reasonable bet.

## Design decision: dispatch-ticket UI

The form is framed as a "ticket" being filed rather than a generic contact
form — each submission gets a visible ticket number, and the admin view is
called the "desk." This isn't just decoration: it reinforces the actual
product idea (every lead is tracked, not lost in an inbox) and gives the
admin dashboard's `New → Contacted → Closed` status column a clear mental
model to sit inside.

## Running locally

```bash
npm install
cp .env.example .env       # then edit ADMIN_USERNAME / ADMIN_PASSWORD / SESSION_SECRET
npm run seed                # creates the admin account (idempotent, safe to skip if already seeded)
npm start                   # runs on http://localhost:3000
```

Visit `http://localhost:3000` for the public form, `http://localhost:3000/admin`
for the dashboard.

## Deploying (Render, free tier)

1. Push this repo to GitHub (public, `.env` is gitignored — don't commit it).
2. On [render.com](https://render.com), create a **Web Service** from the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables in Render's dashboard: `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`, `SESSION_SECRET` (generate a long random string).
5. Add a **persistent disk** mounted at `/opt/render/project/src` (or wherever
   the repo lives) so `leaddesk.db` survives restarts — Render's default
   filesystem is ephemeral otherwise.
6. After first deploy, run `npm run seed` once via Render's shell tab to
   create the admin account.

## What I'd add with another day

- Rate limiting on `/api/leads` (currently anyone can spam submissions)
- Pagination on the admin table once lead volume grows past a page or two
- CSRF protection on the state-changing admin routes
- Swap `node:sqlite` for Postgres if this ever needed more than one app
  instance running at once (SQLite's single-writer model doesn't scale
  horizontally)

## AI use disclosure

[Write this yourself — be specific about what you asked for, what you kept,
and what you changed. e.g.: "I used Claude to scaffold the Express routes and
the initial CSS, then changed the ticket-number UX to show a provisional
number before the real one comes back, rewrote the empty-state copy, and cut
an animation that felt gimmicky."]
