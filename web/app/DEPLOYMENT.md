# Publish to GitHub & Deploy (Vercel + Neon)

This guide walks through creating **your own** GitHub repo, connecting **Vercel**, and using **Neon Postgres** for cloud sync.

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
