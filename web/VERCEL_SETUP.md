# Vercel deploy checklist — fud-ai-web

Follow these steps in order. The build was verified locally and should succeed on Vercel.

---

## Step 1 — Import project

1. Open **[vercel.com/new](https://vercel.com/new)** (log in with GitHub as **aswin-nair**)
2. Click **Import** next to **`aswin-nair/fud-ai-web`**
3. On the configure screen:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Other |
| **Root Directory** | `web` ← click Edit, select `web` |
| **Build Command** | *(leave default — uses `web/vercel.json`)* |
| **Output Directory** | *(leave default)* |

Do **not** use the repo root — only the `web` folder deploys the app + API.

---

## Step 2 — Environment variables

Expand **Environment Variables** and add **all** of these for **Production**, **Preview**, and **Development**:

| Name | Where to get it |
|------|-----------------|
| `DATABASE_URL` | Neon dashboard → Connection string (with `?sslmode=require`) |
| `JWT_SECRET` | Run below to generate one |
| `VITE_GOOGLE_CLIENT_ID` | Same as your `.env.local` Google client ID |
| `GOOGLE_CLIENT_ID` | **Same value** as `VITE_GOOGLE_CLIENT_ID` |
| `VITE_DATA_BACKEND` | `neon` |

Generate `JWT_SECRET` in PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Copy the output into `JWT_SECRET`.

Your Google client ID (from local setup):

```
1011638039826-rfqs4rk60m76554c9i0tphubm0e2q9gi.apps.googleusercontent.com
```

---

## Step 3 — Deploy

Click **Deploy** and wait ~2–3 minutes.

Your URLs will be:

- App: `https://YOUR-PROJECT.vercel.app/app/login`
- Health: `https://YOUR-PROJECT.vercel.app/api/health`

Root `/` redirects to `/app/login`.

---

## Step 4 — Google OAuth (required for Google sign-in)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your **Web client**
2. **Authorized JavaScript origins** → Add:
   - `https://YOUR-PROJECT.vercel.app`
3. Save (changes can take a few minutes)

---

## Step 5 — Verify

```powershell
curl https://YOUR-PROJECT.vercel.app/api/health
```

Expected:

```json
{"ok":true,"database":true,"timestamp":"..."}
```

If `"database":false` → check `DATABASE_URL` in Vercel env vars and redeploy.

Then open the app, **Sign up** with email, log a meal, and confirm rows appear in Neon (`users`, `user_states`).

---

## Optional — CLI deploy (after login)

```powershell
cd "C:\Users\aswin\Desktop\Fud AI\web"
npx vercel login
npx vercel link          # select aswin-nair / fud-ai-web
npx vercel env pull .env.local   # sync env from Vercel (optional)
npx vercel deploy --prod
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 404 on `/app/` | Root Directory must be `web`, not repo root |
| Build fails | Check Vercel build logs; run `npm run build` in `web/app` locally |
| Sign-up fails / 503 | `DATABASE_URL` or `JWT_SECRET` missing → add env vars → **Redeploy** |
| Google sign-in blocked | Add Vercel URL to Google **Authorized JavaScript origins** |
| Data not syncing | `VITE_DATA_BACKEND` must be `neon` (rebuild required after change) |

After changing any env var in Vercel, go to **Deployments → ⋯ → Redeploy**.
