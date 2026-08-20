# Neon backup retention

- Status: Proposed, not certified
- Date: 2026-08-20
- Owners: Engineering (UNASSIGNED)

## Decision

Provider backups may retain encrypted copies of Neon data for a proposed
maximum of 30 days. That window is a product proposal, not a confirmed Neon
or Vercel setting.

A restore into any environment must re-run deletion reconciliation before the
environment is treated as clean. Cascade deletes in live tables do not prove
that a restored backup omitted a later-deleted account.

## What this repo can prove

- Count-only cleanup of expired sessions, mutation ledgers, reset-token
  hashes, idle rate-limit buckets, and terminal migration artifacts.
- Count-only leftover-row checks for user-owned tables after `users` rows
  are gone.
- Browser draft expiry and clear-path tests on IndexedDB, fallback, and
  recovery locations.

## What this repo cannot prove

- The provider backup class, region, or expiry that is actually configured.
- Restore to a clean environment.
- Restore after account deletion.
- Recovery from a partial provider failure.
- That deleted accounts cannot reappear after restore.

Run the rehearsal against synthetic data only:

```text
npm.cmd run db:retention-rehearsal --prefix web
```

Never download production health data to a developer machine.
