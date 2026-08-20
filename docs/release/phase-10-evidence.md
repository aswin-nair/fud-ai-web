# Phase 10: release automation and evidence

This records the repo-side Phase 10 foundation. It is not a release approval,
not a hosted CI certification, and not permission to assign a candidate.
`docs/release/evidence.json` stays unassigned with every gate pending.

## What landed

- `release:check` now fails for pending, failed, or waived gates, a
  commit/version mismatch, an unassigned candidate, or missing evidence on a
  pass/waiver. Forbidden locators such as database URLs cannot enter the
  ledger.
- `npm run release:bundle` writes a commit-bound, count-only artifact:
  lockfile and schema hashes, sourcemap counts, suite status, and uncertified
  notes. It does not change `evidence.json`.
- A release-candidate cloud build can emit hidden sourcemaps. Confirmation is
  file counts only; map bodies are not copied into the ledger.
- The release-candidate workflow uploads the bundle and Playwright report
  even when a later step fails. The final evidence command still fails while
  any gate is unresolved.
- Mobile `export:check` stays fail-closed unless `EXPO_EXPORT=true`.

## Still uncertified

- A named owner assigning `candidate.commit` and attaching durable evidence.
- Hosted staging lifecycle, Expo export, device-matrix, and backup rehearsal.
- Any of the 16 gates in `docs/release/evidence.json`.
