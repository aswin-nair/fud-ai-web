# Phase 2: cloud deployment path

This records the repo-side Phase 2 work. It is not hosted Neon certification
and it is not a release approval. `docs/release/evidence.json` stays
unassigned with every gate pending.

## What landed

- Local, cloud/Neon, and release-candidate cloud builds are separate commands.
  A production build without an explicit `local` or `neon` backend fails.
  The running app no longer treats a missing backend as local.
- `web/` Vercel installs fail if `packages/domain` is not available. A cloud
  or release build writes `dist/release-info.json` and greps the bundle for
  the Neon marker and `@fud-ai/domain`.
- `/api/health` is liveness only. `/api/ready` runs a bounded `SELECT 1` and
  returns `503` when Neon is unreachable. Neither response includes a
  database address or provider error.
- `/app/**` sends CSP, frame denial, object blocking, referrer policy, HSTS,
  MIME sniffing protection, and OAuth-compatible COOP. The policy is tested
  against `web/vercel.json`.
- Staging lifecycle coverage exists. Without `STAGING_BASE_URL` the suite
  prints `STAGING NOT CERTIFIED` and does not report a pass.

## Still uncertified

- A hosted staging deploy against a real Neon database.
- Google sign-in and BYOK against the live header policy on that host.
- Hosted cookie, replay, and recovery-mail checks. Repo-side Phase 3 is in
  `phase-3-auth-recovery.md`.
- Any evidence gate in `docs/release/evidence.json`.
