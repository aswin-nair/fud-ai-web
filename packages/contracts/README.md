# Shared contracts

Version `1` envelopes for account-backed entities, mutations, and
explicit local-to-cloud migration. This package is not permission to
replace snapshot sync.

- Calendar labels are stored with the record. Historical days are never
  rebuilt from the current device zone.
- Mutation UUIDs are idempotent. A replay with a different payload is a
  conflict, not a second write.
- Derived streak is recomputed from accepted calendar events. Client XP,
  level, quest, and badge totals are not trusted.
- Local upload stays fail-closed until an approved migration workflow
  is enabled. The first cloud beta is new accounts only.

`web/shared/appStateContract.ts` remains the snapshot allowlist used by
the live `PUT /api/state` path.
