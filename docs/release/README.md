# Release evidence

`evidence.json` is the release-candidate ledger. A feature being implemented or a
test passing on one developer machine is not enough to mark a launch gate as
passed.

## Workflow

1. Assign the candidate version, immutable commit SHA, and build timestamp.
2. Run `npm run release:check:structure` before requesting review.
3. For each gate, attach durable evidence: a CI URL, redacted report, signed
   review, dashboard export, rehearsal record, or device-matrix result.
4. A named owner changes `status` to `pass` only after reviewing that evidence.
5. Run `npm run release:check`. Any pending, failed, or waived gate blocks the
   Phantom-grade label. A waiver remains visible but does not pass this check.

Never put food logs, body measurements, photos, credentials, bearer tokens, raw
database exports, or other user data in this directory. Use aggregates and
redacted identifiers only.
