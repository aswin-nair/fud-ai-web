# Phase 5: mobile account and outbox

This records the repo-side Phase 5 foundation. It is not hosted mobile-sync
certification, not an EAS or store submission, and not a release approval.
`docs/release/evidence.json` stays unassigned with every gate pending.

## What landed

- Expo can register, sign in, recover a password, sign out, sign out
  everywhere, and delete a cloud account against the existing API.
- Access tokens stay in memory. The refresh credential is written only to
  SecureStore, never SQLite or ordinary storage.
- A device binding blocks a second account while local profile or meal rows
  exist. Sign-out clears the session and keeps that binding.
- Mobile refresh tokens are returned in JSON only when
  `ENABLE_MOBILE_AUTH=true` and the request has no browser Origin or Referer.
  Web logins still use the HttpOnly cookie and never include `refreshToken`.
- SQLite now has a secret-free `sync_outbox` and `sync_state`. New meals can
  be projected to contract v1 using the stored local date. Upload stays off
  unless `EXPO_PUBLIC_ENABLE_ENTITY_SYNC` and `ENABLE_ENTITY_PROJECTION` are
  both true.
- `POST /api/entities` is fail-closed. Existing local meals are not uploaded.
  The first cloud beta is still new accounts only.

## Still uncertified

- Hosted mobile sign-in, refresh rotation, and SecureStore behavior on a
  physical device.
- Native Google sign-in UI.
- Dual-write or live entity sync on a hosted deploy.
- Signed EAS profiles, store privacy labels, and the device matrix.
- Airplane-mode, process-death, and multi-device rehearsals on hardware.
- Any evidence gate in `docs/release/evidence.json`.
