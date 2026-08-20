# Account API security notes

The API requires the account-security objects in `db/schema.sql`. Existing
deployments can apply only the additive migration with:

```powershell
npm.cmd run db:migrate:security
npm.cmd run db:migrate:refresh
npm.cmd run db:migrate:entities
npm.cmd run db:audit-byok
```

Deploy the migration before the API release. Existing 30-day browser bearers
and sessions without a refresh hash cannot be reused. Users sign in again.
Retain the audit's two aggregate counts as release evidence. Both must be
zero; the command exits `1` if any `apiKey` path remains and never prints
state values, account data, or the database URL.

Auth handlers live under `api/_auth/` and are reached through one
`api/auth.ts` function. Public URLs stay `/api/auth/<action>`. Vercel Hobby
rejects a deployment after a green build once more than 12 serverless
files sit under `api/` outside `_` folders.

## Session and state guarantees

- Access JWTs last 15 minutes, carry `use: access`, and identify a database
  session. Tokens without that claim, including previous 30-day bearers,
  return `401`.
- A rotating refresh token is stored only as a SHA-256 hash. The browser
  receives it in an HttpOnly, SameSite=Lax cookie (`fud_refresh`), never in
  `localStorage`.
- Replaying a replaced refresh token revokes the whole session family.
- `POST /api/auth/refresh` issues a new access token and rotates the cookie.
- `POST /api/auth/logout` revokes the current session and clears the cookie.
- `POST /api/auth/logout-all` revokes every session and clears the cookie.
- Password change and account deletion revoke every session.
- `DELETE /api/account` requires `{ "confirmation": "DELETE" }` and deletes the
  user. Foreign-key cascades remove state, sessions, mutation history, reset
  tokens, entity rows, tombstones, device cursors, and migration ledger rows
  in the same PostgreSQL transaction.
- `PUT /api/state` remains the live write path. It requires
  `{ state, baseVersion, mutationId }`. `mutationId` is a canonical UUID
  retained across ambiguous retries. Replaying the same request returns its
  original version; reusing the ID for another payload or base version
  returns `409`.
- Versioned entity contracts live in `@fud-ai/contracts`. Additive tables
  store calendar-stable records, tombstones, device cursors, and a
  count-only migration ledger. `ENABLE_ENTITY_PROJECTION` and
  `ENABLE_LOCAL_MIGRATION` stay off. `POST /api/migrations` returns `503`
  until an approved, consented workflow is enabled. `POST /api/entities`
  returns `503` while entity projection is off. `ENABLE_MOBILE_AUTH` stays
  off; a mobile client grant returns `503` and never puts a refresh token
  in a browser JSON response. The first cloud beta is new accounts only.

Rate-limit bucket keys are HMACs, so raw IPs and email addresses are not stored.
Vercel's spoof-resistant `x-forwarded-for` is trusted only on Vercel; other
reverse proxies require `TRUST_PROXY=1` after their forwarding boundary is
secured. Set a separate 32+ character `RATE_LIMIT_SECRET` in production. If it
is absent, `JWT_SECRET` is used.

Set `ENABLE_CLOUD_WRITES=false` to stop state PUTs and account deletion during
an incident. Those operations return a stable `503`; authenticated state reads
and logout/session revocation remain available for recovery. Unset the variable
or set it to `true` during normal operation.

Set `ENABLE_ACCOUNT_CREATION=false` to stop new email and Google accounts.
Existing Google sessions can still sign in. Internal and invite cohorts also
require `BETA_COHORT` plus `BETA_INVITE_HASHES`. The API compares SHA-256
invite hashes only and never echoes the address. Leave `BETA_COHORT` unset
until a named owner starts dogfood. This repository does not start dogfood.

Google sign-in requires Google's verified-email claim and never links accounts
by email address alone. A same-address email/Google collision returns `409`.
Account linking remains disabled until an explicit flow can prove control of
both existing sign-in methods.

## Password recovery

`POST /api/auth/forgot-password` always returns the same public response for
known and unknown addresses. `POST /api/auth/reset-password` consumes a
one-time SHA-256-hashed token (30-minute expiry) and revokes every session.

Mail is sent only when `RESEND_API_KEY`, `MAIL_FROM`, and `APP_ORIGIN` are
set. `APP_ORIGIN` must be a fixed HTTPS origin, or `http://localhost` for
local work. The handler never uses the request `Host` header and never logs
the token, the address, or the reset URL. Without those variables the
endpoint still returns the generic success body and does not send mail.
