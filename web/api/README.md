# Account API security notes

The API requires the account-security objects in `db/schema.sql`. Existing
deployments can apply only the additive migration with:

```powershell
npm.cmd run db:migrate:security
npm.cmd run db:audit-byok
```

Deploy the migration before the API release. Existing bearer tokens do not
contain a database-backed session ID and will intentionally require sign-in
again. Retain the audit's two aggregate counts as release evidence. Both must
be zero; the command exits `1` if any `apiKey` path remains and never prints
state values, account data, or the database URL.

## Session and state guarantees

- JWTs identify a database session. Expired or revoked sessions return `401`.
- `POST /api/auth/logout` revokes the current session.
- `POST /api/auth/logout-all` revokes every session for the authenticated user.
- `DELETE /api/account` requires `{ "confirmation": "DELETE" }` and deletes the
  user. Foreign-key cascades remove state, sessions, mutation history, and reset
  tokens in the same PostgreSQL transaction.
- `PUT /api/state` requires `{ state, baseVersion, mutationId }`. `mutationId`
  is a canonical UUID retained across ambiguous retries. Replaying the same
  request returns its original version; reusing the ID for another payload or
  base version returns `409`.

Rate-limit bucket keys are HMACs, so raw IPs and email addresses are not stored.
Vercel's spoof-resistant `x-forwarded-for` is trusted only on Vercel; other
reverse proxies require `TRUST_PROXY=1` after their forwarding boundary is
secured. Set a separate 32+ character `RATE_LIMIT_SECRET` in production. If it
is absent, `JWT_SECRET` is used.

Set `ENABLE_CLOUD_WRITES=false` to stop state PUTs and account deletion during
an incident. Those operations return a stable `503`; authenticated state reads
and logout/session revocation remain available for recovery. Unset the variable
or set it to `true` during normal operation.

Google sign-in requires Google's verified-email claim and never links accounts
by email address alone. A same-address email/Google collision returns `409`.
Account linking remains disabled until an explicit flow can prove control of
both existing sign-in methods.

## Password recovery dependency

`_lib/passwordReset.ts` provides cryptographically random 256-bit reset tokens,
SHA-256-at-rest token hashes, 30-minute expiry, one-time consumption, and session
revocation after a successful reset. There is deliberately no public reset
request endpoint yet: the project has no verified transactional-email provider.

Before exposing recovery, connect an email provider that verifies ownership,
always returns the same public response for known and unknown addresses, uses a
fixed HTTPS application origin (never the request `Host` header), and never logs
the token. The raw token returned by the service primitive may only be handed to
that provider; it must never be stored.
