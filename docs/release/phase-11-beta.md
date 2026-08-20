# Phase 11: controlled beta foundation

This records the repo-side Phase 11 foundation. It is not the start of
internal dogfood, not an invite-only cohort, not a public rollout, and not
a release approval. `docs/release/evidence.json` stays unassigned with
every gate pending.

## What landed

- `@fud-ai/contracts` now owns cohort sizes, public steps, mandatory
  thresholds, kill-switch names, and stop-the-line halt rules.
- New-account enrollment can be closed with `ENABLE_ACCOUNT_CREATION=false`.
  Existing Google sessions still sign in.
- Internal and invite cohorts require SHA-256 invite hashes. The API never
  echoes the address. Leave `BETA_COHORT` unset until an owner starts dogfood.
- Cohort caps are count-only. Unknown or unconfigured invite programs return
  a generic 503.
- `npm run beta:rehearsal` prints `BETA NOT CERTIFIED` for export, delete,
  logout-all, offline logging, and conflict recovery.

## Still uncertified

- 20–30 invited dogfood users on staging-like production infrastructure.
- 50–150 invite-only users across two weekly cohorts.
- Daily incident review with named owners.
- Hosted export, delete, logout-all, offline, and conflict exercises.
- Any evidence gate in `docs/release/evidence.json`.

Post-launch features (barcode, insights, HealthKit, i18n, managed AI) stay
out of scope. ADR 0003 still treats dogfood as not started.
