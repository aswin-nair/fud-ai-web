# Publish to GitHub & Deploy (Vercel + Neon)

This guide walks through creating **your own** GitHub repo, connecting **Vercel**, and using **Neon Postgres** for cloud sync.

> **poiem.app runs on Vercel's free Hobby plan**, with Neon for the database and
> Cloudflare only for DNS. Follow "Deploy poiem.app on Vercel" below.

---

## Deploy poiem.app on Vercel (free)

The Hobby plan is free for personal, non-commercial use. It allows one function
region and cron jobs that run once a day (±59 minutes), which is all Poiem
needs: `web/vercel.json` pins functions to `sin1` (Singapore), next to the Neon
database, and runs the retention job daily around 04:00 UTC.

1. **Merge to `main`.** Vercel deploys production from `main`.
2. **Create the project.** Sign in at [vercel.com](https://vercel.com) with
   GitHub, choose **Add New → Project**, import `aswin-nair/fud-ai-web`, and set:
   - Project name: `poiem`
   - Root Directory: `web`, with **Include files outside the root directory in
     the Build Step** left on (the install needs `packages/`)
   - Framework Preset: **Other** (build settings come from `web/vercel.json`)

   Deploy. The API answers "Database not configured" until step 5.
3. **Sign in from this computer**, in `web`: `npx vercel@latest login`.
4. **Link the folder** to the new project:
   `npx vercel@latest link --yes --project poiem`.
5. **Add the settings** —
   `powershell -ExecutionPolicy Bypass -File .\scripts\vercel-env.ps1`
   (add `-GoogleClientId …` for Google sign-in). It sends `DATABASE_URL` from
   `web/.env`, generates `JWT_SECRET`, `CRON_SECRET` and `RATE_LIMIT_SECRET`
   (keeping any already set), and sets `APP_ORIGIN`. Everything goes to
   Production only, so preview deployments never reach the live database, and
   no value is printed.
6. **Redeploy** — Deployments → latest deployment → **Redeploy**.
7. **Connect the domain** — Settings → Domains → add `poiem.app`. Vercel shows
   the DNS record to create. In Cloudflare → `poiem.app` → DNS, add exactly that
   record with **Proxy status: DNS only** (grey cloud) so Vercel can issue the
   certificate.
8. **Verify** — `https://poiem.app/api/health` returns `"live":true`,
   `https://poiem.app/api/ready` returns `"ready":true`, and `https://poiem.app`
   opens the login screen. Sign up, log a meal, then sign in from a second
   browser to confirm sync.

For Google sign-in, also add `https://poiem.app` to the OAuth client's
Authorized JavaScript origins. Password-reset mail is optional and needs
`RESEND_API_KEY` and `MAIL_FROM`.

---

## Alternative: Cloudflare Workers (needs Workers Paid)

One Worker (`web/wrangler.jsonc`, entry `web/cloudflare/worker.ts`) serves the
app at `/app`, runs the existing API handlers at `/api` through a small Vercel
request/response adapter, and runs the daily retention job on a cron at 04:00
UTC. `poiem.app` is attached as a Custom Domain, so Cloudflare creates the DNS
record and certificate. Remove any existing `poiem.app` A, AAAA or CNAME record
first.

**The Workers Paid plan is required.** Sign-up, sign-in and password changes
hash with scrypt, which uses roughly 40–60 ms of CPU per hash in the Workers
runtime. The Free plan allows 10 ms of CPU per request and ends Workers that
keep exceeding it with error 1102, so those endpoints would fail. The Paid plan
allows 30 seconds by default. Don't lower the scrypt cost to fit the Free plan.

Run everything from `web`, in your own terminal:

1. **Sign in to Cloudflare** — `npx wrangler login`, then `npx wrangler whoami`.
   In the dashboard, make sure the account is on the Workers Paid plan.
2. **Create a fresh database** —
   `powershell -ExecutionPolicy Bypass -File .\scripts\create-neon-db.ps1`
   creates a new Neon project, applies `db/schema.sql`, and saves `DATABASE_URL`
   to the git-ignored `web/.env` without printing it.
3. **Build and deploy** — `npm run cf:deploy` (builds the Neon client, then
   `wrangler deploy`). For Google sign-in, set
   `$env:VITE_GOOGLE_CLIENT_ID = "…apps.googleusercontent.com"` in the same
   terminal first.
4. **Add secrets** —
   `powershell -ExecutionPolicy Bypass -File .\scripts\cloudflare-secrets.ps1`
   (add `-GoogleClientId …` for Google sign-in). It sends `DATABASE_URL` from
   `web/.env` plus generated `JWT_SECRET`, `CRON_SECRET` and `RATE_LIMIT_SECRET`,
   and keeps any that already exist so a re-run never signs people out.
   Optional mail: `npx wrangler secret put RESEND_API_KEY` and `MAIL_FROM`.
5. **Verify** — `https://poiem.app/api/health` returns `"live":true`,
   `https://poiem.app/api/ready` returns `"ready":true`, and
   `https://poiem.app` opens the login screen.

For Google sign-in, add `https://poiem.app` to the OAuth client's Authorized
JavaScript origins. `APP_ORIGIN` and `COOKIE_SECURE` are plain vars in
`wrangler.jsonc`; nothing secret is committed.

Local Worker run: `npm run cf:dev` (reads `web/.dev.vars` or `web/.env`).

---

## 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project (e.g. `fud-ai`)
3. Copy the **connection string** (`postgresql://...?sslmode=require`)
4. In the Neon **SQL Editor**, paste and run `web/db/schema.sql`  
   — or locally:
   ```bash
   cd web
   cp .env.example .env
   # paste DATABASE_URL into .env
   npm install
   npm run db:migrate
   ```

---

## 2. Publish to GitHub

This folder is currently cloned from `apoorvdarshan/fud-ai`. To publish under **your** account:

```powershell
cd "C:\Users\aswin\Desktop\Fud AI"

# Create a new repo (replace YOUR_USERNAME)
gh repo create YOUR_USERNAME/fud-ai-web --public --source=. --remote=origin --push
```

If `origin` already points to the upstream repo, use a new remote:

```powershell
git remote rename origin upstream
git remote add origin https://github.com/YOUR_USERNAME/fud-ai-web.git
git add .
git commit -m "Add web app with Neon sync, e2e tests, and Vercel config"
git push -u origin main
```

**Do not commit secrets.** These files are gitignored:

- `web/app/.env.local`
- `web/.env`
- Any file containing `DATABASE_URL` or `JWT_SECRET`

---

## 3. Connect Vercel to GitHub

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repository
3. Set **Root Directory** to `web`
4. Enable **Include source files outside of the Root Directory in the Build Step**.
   The app depends on `packages/domain` at the repository root. The install
   command fails if that package is missing.
5. Framework: **Other** (Vercel reads `web/vercel.json`)
6. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Random 32+ char string ([generate](https://1password.com/password-generator/)) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |
| `GOOGLE_CLIENT_ID` | Same as above (for API token verification) |
| `VITE_DATA_BACKEND` | `neon` (the Vercel build command already forces Neon; do not leave this blank for ad-hoc builds) |
| `RELEASE_ID` | Optional. Vercel also provides `VERCEL_GIT_COMMIT_SHA`. |
| `APP_ORIGIN` | Fixed HTTPS origin used in password-reset links. Never taken from the request Host header. |
| `MAIL_FROM` | Verified Resend from-address. Leave unset to keep recovery silent. |
| `RESEND_API_KEY` | Resend API key. Leave unset to keep recovery silent. |
| `ENABLE_ENTITY_PROJECTION` | Leave unset. Snapshot writes stay authoritative. |
| `ENABLE_LOCAL_MIGRATION` | Leave unset. First cloud beta is new accounts only. |
| `ENABLE_MOBILE_AUTH` | Leave unset. Mobile refresh tokens stay out of JSON. |
| `ENABLE_CLOUD_WRITES` | Leave unset or `true`. Set `false` to stop state writes and account deletion. |
| `ENABLE_ACCOUNT_CREATION` | Leave unset or `true`. Set `false` to stop new-account enrollment. |
| `BETA_COHORT` | Leave unset until a named owner starts dogfood. Values: `internal`, `invite`, `public-5`, `public-25`, `public-50`, `public-100`. |
| `BETA_INVITE_HASHES` | Required for `internal` and `invite`. Comma-separated SHA-256 hashes. Never store plaintext invites. |
| `BETA_INVITE_PEPPER` | Optional pepper for invite hashes. |
| `BETA_COHORT_CAP` | Optional count-only cap. Defaults to 30 for internal and 150 for invite. |

7. Click **Deploy**

Your app will be live at:

- `https://your-project.vercel.app/app/`

---

## 4. Google OAuth (production)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your **Web client**:

**Authorized JavaScript origins:**

- `https://your-project.vercel.app`
- `https://your-custom-domain.com` (if you add one)

No redirect URI needed for the Google Identity Services button.

---

## 5. Neon ↔ Vercel integration (optional)

In the Vercel dashboard you can link Neon directly:

1. Project → **Storage** → **Connect Database** → **Neon**
2. This auto-injects `DATABASE_URL` into Vercel env vars

---

## 6. Verify deployment

```bash
curl https://your-project.vercel.app/api/health
# {"live":true,"requestId":"...","release":"..."}

curl https://your-project.vercel.app/api/ready
# {"ready":true,"requestId":"...","release":"..."}  or HTTP 503 when Neon is unreachable
```

`/api/health` only means the function ran. `/api/ready` is the database check.
Neither response includes a connection string or provider error.

Open `https://your-project.vercel.app/app/login`, sign up — data is stored in Neon.

To exercise the full account lifecycle against a dedicated staging deploy:

```bash
STAGING_BASE_URL=https://your-staging.vercel.app npm run test:staging
```

Without that URL the command prints `STAGING NOT CERTIFIED` and does not report a pass.

---

## Local development

| Mode | Command | Storage |
|------|---------|---------|
| **Local only** | `npm run dev` (from repo root) | Browser localStorage |
| **Cloud / Neon client** | `npm run dev:cloud --prefix web/app` | Neon via `/api` |
| **Release-candidate cloud build** | `RELEASE_ID=<sha> npm run build:release` | Neon; fails if the release id is missing |
| **Full stack + Neon** | `cd web && vercel dev` | Neon via `/api` |

For local-only, keep in `web/app/.env.local`:

```env
VITE_DATA_BACKEND=local
VITE_GOOGLE_CLIENT_ID=your-client-id
```

For testing Neon locally with Vercel dev, create `web/.env`:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-local-dev-secret-min-32-chars
VITE_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
```

And `web/app/.env.local`:

```env
VITE_DATA_BACKEND=neon
VITE_GOOGLE_CLIENT_ID=...
```

Then run `vercel dev` from the `web` folder (install Vercel CLI: `npm i -g vercel`).

---

## 7. CI (GitHub Actions)

`.github/workflows/web-ci.yml` runs four checks for relevant pushes and pull
requests:

- web client lint, unit tests, and production build;
- Playwright browser tests using **local** storage (no Neon required);
- API boundary tests and API typechecking; and
- mobile typechecking plus unit and database-migration tests.

---

## Architecture

```
Browser (React SPA at /app/)
    ↓ fetch /api/*
Vercel Serverless Functions (web/api/)
    ↓ SQL
Neon Postgres
    ├── users
    └── user_states (JSON app data per user)
```

Auth uses JWT (30-day sessions). Food logs, profile, weight, and chat sync to Neon when `VITE_DATA_BACKEND=neon`.
