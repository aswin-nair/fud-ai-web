# Fud AI Web Tracker

Privacy-first AI calorie tracker for the browser. It supports per-user device-local
storage or authenticated, versioned Neon cloud snapshots, selected with
`VITE_DATA_BACKEND`.

## Features

- Email/password sign-in in local or cloud mode, plus Google Sign-In in cloud mode
- Per-user browser storage in local mode; authenticated Neon sync with optimistic version checks in cloud mode
- Onboarding with BMR/TDEE/macro goal calculation (same formulas as iOS/Android)
- Home dashboard with calorie ring, macro bars, and meal list
- Text food logging via Gemini (Bring Your Own Key)
- Manual entry fallback
- Edit and delete logged meals
- Export/import JSON backup

## Quick start

```bash
cd web/app
npm install
cp .env.example .env.local
# Leave VITE_DATA_BACKEND=local for device-local development.
# Cloud and Google setup are covered below and in DEPLOYMENT.md.
npm run dev
```

Open **http://localhost:5173/login**

## Testing

```bash
cd web/app
npm run ci          # lint + unit tests + build + e2e
npm run test:e2e    # Playwright only
npm run test:e2e:ui # interactive mode
```

`npm run ci` includes lint, unit tests, the production build, and Playwright.
E2e tests use local email/password auth (no Google or Neon required). GitHub
Actions also checks the API boundary and mobile app; see
`.github/workflows/web-ci.yml`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup, env vars, and production checklist.

## Google Auth setup (cloud mode)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. **APIs & Services → OAuth consent screen**
   - User type: External (or Internal for workspace)
   - Add app name, support email, and `userinfo.email` + `userinfo.profile` scopes
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:5173` (dev)
     - `https://your-domain.com` (production)
   - Redirect URIs are not required for the Google Identity Services button flow
5. Copy the **Client ID** into `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

6. Restart the dev server

### Vercel production

Add the same variable in Vercel → Project → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Your OAuth Web Client ID |

Also add your production URL (e.g. `https://fud-ai.app`) to **Authorized JavaScript origins** in Google Cloud.

## Gemini AI setup

1. Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Open **Settings → AI Access** in the app and paste your key
3. Describe your meal on the **Log** screen

Your Gemini key stays in a separate device-local browser record. It is excluded
from app-state exports and cloud snapshots.

## Production build

```bash
cd web/app
npm run build
```

Output goes to `web/app/dist/` and is served at `/app/` alongside the marketing site.

## Tech stack

- Vite + React + TypeScript
- `@react-oauth/google` for Google Sign-In
- React Router
- Per-user `localStorage` or authenticated, versioned Neon snapshots
- Direct Gemini API calls (BYOK)
