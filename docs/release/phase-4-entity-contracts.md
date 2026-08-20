# Phase 4: entity contracts and migration

This records the repo-side Phase 4 foundation. It is not hosted entity-sync
certification and it is not a release approval. `docs/release/evidence.json`
stays unassigned with every gate pending.

## What landed

- `@fud-ai/contracts` is contract version `1` for calendar context, entities,
  mutations, tombstones, device cursors, acknowledgements, and a count-only
  migration ledger.
- Food and exercise local dates are assigned from the stored instant plus an
  explicit IANA zone. Weight `date` is already a calendar label and is not
  reinterpreted. Historical days are never rebuilt from "now".
- Additive Neon tables and `apply_entity_mutation` exist beside the snapshot
  path. `PUT /api/state` remains authoritative.
- Derived streak is recomputed from accepted food calendar days. Client XP,
  level, quest, and badge totals are ignored.
- `POST /api/migrations` is fail-closed unless `ENABLE_LOCAL_MIGRATION=true`.
  The public refusal does not mention an email or local storage key.

## Still uncertified

- Dual-writing snapshot saves into entity rows on a hosted deploy.
- A consented local-to-cloud upload UI and batch import.
- Server XP, freeze, quest, and badge recomputation after Phase 6 extraction.
- Disabling legacy snapshot writes.
- Any evidence gate in `docs/release/evidence.json`.
