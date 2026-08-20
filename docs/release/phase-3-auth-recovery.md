# Phase 3: authentication and recovery

This records the repo-side Phase 3 work. It is not hosted recovery
certification and it is not a release approval. `docs/release/evidence.json`
stays unassigned with every gate pending.

## What landed

- Access tokens last 15 minutes, require `use: access`, and live in memory.
  A 30-day bearer in `localStorage` is cleared and rejected.
- Refresh tokens rotate, are stored as SHA-256 hashes, and are sent only in
  an HttpOnly SameSite cookie. Replaying a replaced token revokes the family.
- Logout, logout-all, password change, and account deletion revoke sessions
  and clear the cookie. Device sign-out still completes if revocation is
  offline.
- Forgot-password always returns the same public body. Reset consumes a
  one-time 30-minute token and revokes every session. Mail is sent only when
  `APP_ORIGIN`, `MAIL_FROM`, and `RESEND_API_KEY` are set.
- Google and email accounts still do not merge on a matching address.

## Still uncertified

- Mail delivery against a live Resend account and verified domain.
- Cross-tab and replay checks on a hosted staging deploy.
- Any evidence gate in `docs/release/evidence.json`.
