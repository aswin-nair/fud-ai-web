# Phase 9: retention, deletion, backup, and recovery

This records the repo-side Phase 9 foundation. It is not a hosted Vercel cron
certification, not a Neon backup-policy approval, not a restore-after-deletion
proof, and not a release approval. `docs/release/evidence.json` stays
unassigned with every gate pending.

## What landed

- Food-log drafts now use a separate IndexedDB (`fud-ai-web-drafts`) as the
  primary store. Ordinary browser storage is the fallback only when IndexedDB
  cannot be opened. Photo bytes and BYOK keys are still never persisted.
- Each draft section expires seven days after its last edit. Corrupt recovery
  blobs expire seven days after quarantine. Successful log, data reset, and
  account deletion still clear active and recovery copies. Sign-out keeps the
  same account's drafts on that device.
- Retention cleanup is a shared count-only job: expired sessions, mutation
  ledgers, reset-token hashes, idle rate-limit buckets, and terminal migration
  artifacts. A second query counts leftover rows for user ids that are not in
  `users`.
- `/api/cron/retention` is fail-closed unless `CRON_SECRET` and `DATABASE_URL`
  are both set. Responses and logs are aggregate counts only.
- `npm run db:retention-rehearsal --prefix web` walks the backup/restore/
  deletion checklist and always prints `RETENTION NOT CERTIFIED` for provider
  backup, restore, and backup expiry.

## Still uncertified

- A hosted Vercel cron actually running on the deployed project.
- Neon backup retention, restore to a clean environment, and backup expiry.
- Proof that a deleted account cannot reappear after a provider restore.
- Production-data rehearsal. Synthetic accounts only; never download
  production health data.
- Any evidence gate in `docs/release/evidence.json`.
