# Backup, restore, migration, export, and deletion rehearsal

Run this against a production-like Vercel/Neon environment containing synthetic
accounts only. Never download production health data to a developer machine.

## Fixture

Create at least three synthetic accounts:

1. empty/new account;
2. large history spanning DST and multiple schema versions;
3. deliberately malformed legacy snapshot held for quarantine testing.

Include food, weight, exercise, saved meals, Coach history, pause days, XP
idempotency keys, a pending offline mutation, and a local-only fake BYOK marker.
The marker must never appear in the database or exported state.

## Rehearsal

1. Record release SHA, schema version, environment, owners, and UTC start time.
2. Capture database row counts, snapshot versions, and one-way checksums of the
   synthetic records.
3. Create the provider-supported backup/branch and record its immutable ID.
4. Apply migrations through `npm run db:migrate --prefix web`.
5. Verify counts, versions, contract validation, BYOK absence, and checksums.
6. Log offline, close the client, relaunch offline, reconnect, and drain twice.
   Confirm the mutation appears exactly once.
7. Export, reset, and restore the large account. Reconcile every collection count
   and relevant checksum.
8. Delete one synthetic account. Confirm authentication, state, sessions, and
   mutation/idempotency rows are gone while the other accounts remain unchanged.
9. Restore the backup into an isolated environment and repeat the validation.
10. Record elapsed time, data-loss window, failures, screenshots containing only
    synthetic data, and approver signatures.

Any count/checksum mismatch, BYOK match, cross-account change, duplicate mutation,
or unconfirmed deletion fails the release gate.

## Repo-side rehearsal

`npm run db:retention-rehearsal --prefix web` can run the count-only cleanup
and leftover-row queries when `DATABASE_URL` is set. It never claims Neon
backup, restore, backup expiry, or restore-after-deletion. Those steps stay
`uncertified` until an operator records a provider backup ID, an isolated
restore, and a post-restore reconciliation against synthetic accounts only.

See `docs/operations/backup-retention.md` for the proposed 30-day backup
window and the restore rule: re-run deletion reconciliation after every
restore.
