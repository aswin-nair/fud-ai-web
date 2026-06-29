# Fud AI Web Tracker

Privacy-first AI calorie tracker for the browser. Sign in with Google; food logs are stored per-account in your browser.

## Features

- **Google Sign-In** — one account per browser profile, separate local data per user
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
# Add your Google OAuth Client ID to .env.local (see below)
npm run dev
```

Open **http://localhost:5173/login**

## Testing

```bash
cd web/app
npm run ci          # lint + build + e2e (15 tests)
npm run test:e2e    # Playwright only
npm run test:e2e:ui # interactive mode
```

E2e tests use email/password auth (no Google required). CI runs on GitHub Actions via `.github/workflows/web-ci.yml`.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel setup, env vars, and production checklist.

## Google Auth setup

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

Your Gemini key stays in localStorage on your device only.

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
- localStorage (per Google user ID)
- Direct Gemini API calls (BYOK)
