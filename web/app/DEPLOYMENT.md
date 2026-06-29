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
4. Framework: **Other** (Vercel reads `web/vercel.json`)
5. Add **Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Random 32+ char string ([generate](https://1password.com/password-generator/)) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |
| `GOOGLE_CLIENT_ID` | Same as above (for API token verification) |
| `VITE_DATA_BACKEND` | `neon` |

6. Click **Deploy**

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
# {"ok":true,"database":true,...}
```

Open `https://your-project.vercel.app/app/login`, sign up — data is stored in Neon.

---

## Local development

| Mode | Command | Storage |
|------|---------|---------|
| **Local only** | `npm run dev` (from repo root) | Browser localStorage |
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

`.github/workflows/web-ci.yml` runs lint, build, and e2e tests on push. E2e uses **local** storage (no Neon required in CI).

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
