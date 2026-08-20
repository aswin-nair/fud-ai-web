# Local data migration map v1

- Status: Design baseline; not implemented
- Last reviewed: 2026-08-17
- Source inventory: `docs/data/local-data-inventory.md`

## Goal

Move eligible local web or Expo data into an authenticated, account-backed model without losing accepted entries, duplicating XP, syncing secrets, or deleting the recoverable source prematurely.

This map describes migration decisions. It does not declare the current `user_states` JSONB blob to be the final server model.

## Version identities

These versions are independent and must not be conflated:

- Web raw `AppState` with no version: source version `web-state-v0`.
- Expo Drizzle baseline `0000_lazy_nova`: source database version `mobile-sqlite-0000`.
- Future runtime state/API envelope: contract version `1`.
- Postgres schema migrations: their own ordered migration IDs.

## Required migration envelope

Each attempt records:

- client-generated `migrationId` and idempotency key;
- authenticated destination user and source device ID;
- source kind and schema version;
- start, last-attempt, completion, confirmation, and rollback-expiry timestamps;
- per-entity discovered, accepted, rejected, and reconciled counts;
- deterministic checksums over canonicalized source and accepted destination records;
- current stage: `detected`, `previewed`, `uploading`, `reconciling`, `complete`, `confirmed`, `rolled_back`, or `failed`;
- structured rejection reasons without meal names, chat text, secrets, or raw photos in logs.

## Web `AppState` mapping

| Source | Destination concept | Transform and validation | Conflict/reconciliation rule |
|---|---|---|---|
| `onboarded` | onboarding/profile status | Treat as a hint. Mark complete only after the required adult profile fields validate. | Server-valid profile wins; never use the boolean to bypass the age gate. |
| `profile` calculation inputs | `profiles` | Preserve supported inputs and units. Capture an explicit IANA time zone because web v0 does not store one. | User confirms ambiguous or unsupported enum values. |
| `profile.custom*`, goal, body-fat, and rate inputs | `nutrition_targets` input plus calculation record | Run the shared target calculation. Store calculation version and structured explanation reasons. | Never copy a client calorie target as an approved server result. Refusal and clamps must be shown. |
| `foodEntries[]` | `food_entries` | Preserve client string ID as mutation/idempotency identity, instant, reviewed nutrition, source, meal type, serving, emoji, and ingredient lines. Derive a local-day key only from the confirmed migration zone. | Idempotent upsert by user plus client mutation ID. Same-ID/different-content conflicts produce a recoverable copy; no duplicate XP. |
| `weightEntries[]` | `weight_entries` | Preserve ID, instant/date, and kilograms after range/schema validation. | Idempotent by user plus client ID; do not silently merge same-day measurements. |
| `exerciseEntries[]` | `exercise_entries` | Preserve ID, name, timestamp, duration, energy, and optional presentation metadata after validation. | Idempotent by user plus client ID. XP is validated separately. |
| `favoriteMeals[]` | `favorite_meals` | Preserve saved-meal ID, reviewed nutrition, meal type, serving, and ingredients. | Same-ID conflicts retain a recoverable copy; content hashes may suggest, not force, deduplication. |
| `chatMessages[]` | coach conversation/message records | Offer separate, explicit inclusion because content is private. Preserve order, role, ID, and timestamp. | Never place message content in migration telemetry. Same-ID conflicts retain both under separate conversations. |
| `aiSettings.provider/model` | local or account preference, pending product decision | May migrate only after the AI-mode ADR and disclosure are accepted. | Destination preference wins only after user confirmation. |
| `aiSettings.customInstructions` | local private preference by default | Do not migrate in v1 unless separately disclosed and approved. | Remains in the rollback copy. |
| `aiSettings.apiKey` | no server destination | Exclude before serialization. The current compatibility store is `fud-ai-private-ai-key-<userId>`; a future mobile client uses platform secure storage. | Any destination occurrence is a security incident requiring investigation and purge. |
| `gamification.xp`, `level`, freeze count/month, quest progress | derived server state | Recompute from accepted meal/points/freeze events using the shared domain. | Compare computed and client values; record only a non-sensitive mismatch reason. Server computation wins. |
| `gamification.xpEvents[]` | append-only XP-event input/audit candidate | Validate dedup key, related accepted action, amount, and timestamp. Do not trust arbitrary labels or totals. | Accept once by dedup key; reject unsupported awards. |
| `gamification.freezeUsedDates[]` | freeze ledger input | Validate local dates and monthly policy. | Shared policy/server ledger wins. |
| `gamification.pauseStartedDate`, `pauseProtectedDates[]` | pause interval/neutral-day input | Validate exact local dates; preserve neutral days without adding streak credit or consuming freezes. | Merge the protected-date set and reconcile any active interval before streak calculation. |
| `gamification.awardedKeys[]` | idempotency ledger input | Validate supported key formats and reconcile against accepted actions; never truncate with the presentation feed. | Set union of verified keys; unsupported client awards are rejected. |
| `gamification.seenBadgeIds[]` | user presentation preference | Merge valid known IDs after merging `fud-seen-badges`. | Set union of known IDs. |
| `gamification.pendingLevelUp` | none | Drop as ephemeral UI state. | Recreate presentation state only from a new post-migration event. |

## Other web stores

| Source | Decision |
|---|---|
| Legacy `fud-ai-web-state` | Detect without deleting. Include in preview only if no newer per-user state exists. Retain the original through the disclosed rollback window. |
| `fud-ai-local-users` | Never upload password hashes or salts. Authenticate/create the destination through the approved account flow, then retire local credentials only after confirmation. |
| `fud-ai-auth-session` and `fud-ai-auth-token` | Never migrate as data. New authentication creates a new destination session. |
| `fud-analytics` | Do not backfill to a production analytics sink. Retain or delete locally according to the accepted privacy decision. |
| `fud-notify-log` | Do not migrate; it is device-local daily delivery state. |
| `fud-seen-badges` | Merge known IDs into the AppState badge preference, then remove only after migration confirmation. |

## Expo SQLite mapping

| Source table | Destination concept | Transform and exclusion rules |
|---|---|---|
| `profile` | `profiles` and recalculated `nutrition_targets` | Preserve profile inputs and IANA time zone. Recalculate the materialized target columns; do not trust them as authoritative. |
| `foods` | custom food/favorite records | Exclude `source = builtin` catalog rows from user-data upload. Migrate custom or favorited user records with stable client identities added by the migration adapter. |
| `meal_entries` | `food_entries` | Preserve `logged_at_utc` and the stored `local_date`. Translate integer IDs into namespaced client IDs and retain the old ID in migration metadata. |
| `points_ledger` | XP-event reconciliation input | Validate append-only rows and supported reason codes. Recompute total and level. |
| `streak_freezes` | freeze ledger | Preserve grant/consumption local dates and validate monthly policy. |
| `quests` | derived quest state | Regenerate the deterministic quest for the stored day and reconcile completion from accepted actions. |

The current Expo schema has no rows for weight history, exercise, chat, ingredient lines, sync queue, devices, or tombstones; absence must not be interpreted as a deletion request for records already on the account.

## Execution sequence

1. Detect source versions and quarantine malformed records without replacing the source with a fresh state.
2. Build a local preview with counts for profile, meals, weights, exercise, favorites, chat, XP inputs, and rejected rows.
3. Offer a pre-migration export that clearly excludes or separately handles secrets.
4. Require authenticated ownership of the destination.
5. Create the migration ledger row and upload schema-validated, idempotent batches.
6. Recalculate targets, XP, level, streak, freezes, and quests on the trusted implementation.
7. Compare entity counts and canonical checksums, and present any rejected records.
8. Mark complete while retaining the untouched source for a disclosed rollback window.
9. Remove or archive the source only after explicit confirmation or expiry; never remove local BYOK material as a side effect of data sync.
10. Produce a post-migration export and test a retry from every intermediate stage.

## Failure rules

- A failed remote read must not cause a fresh state to overwrite an existing account.
- Timeout/retry uses the same migration and mutation IDs.
- A partial batch is safe to replay.
- Unknown source versions stop with a recoverable export path.
- Rejected safety inputs remain visible to the user with a reason; they are not silently clamped or discarded.
- Original data remains readable while migration status is uncertain.

## Acceptance evidence

- Synthetic empty, typical, large, old, partially malformed, and duplicate histories.
- Web v0 and mobile SQLite baseline fixtures checked into tests.
- Counts and checksums match for every accepted entity type.
- BYOK keys, passwords, tokens, food names, chat content, and photos are absent from migration logs and analytics.
- Replaying the full migration produces no duplicate entry, XP event, or freeze.
- A forced failure after every stage can resume or roll back without data loss.
