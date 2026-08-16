# Local data inventory

- Status: Phase 0 baseline
- Last reviewed: 2026-08-17
- Code baseline: `web/app/src/types.ts`, `web/app/src/lib/*.ts`, and `mobile/src/db/schema.ts`

This document inventories the current web and Expo persistence surfaces. It is descriptive, not permission to sync a field. The migration decision for each group is recorded in `migration-map-v1.md`.

## Classification

| Class | Meaning | Examples |
|---|---|---|
| Secret | Credential material that must never enter normal app-state sync or analytics | BYOK API key, session token, password hash |
| Sensitive | Personal, health-adjacent, food, or private-content data | Birthday, weight, food entries, coach messages |
| Pseudonymous | Product telemetry that can identify a device or account when combined with other data | Analytics events, experiment assignment |
| Preference | User-selected behavior with limited sensitivity | Sound, haptics, provider/model without a key |
| Derived | Recomputable state that is not authoritative | Level, streak, quest progress, calculated targets |

## Web `AppState`

The current record is unversioned JSON stored under `fud-ai-web-state-<userId>`. Runtime `AppState` still carries the BYOK key for AI calls, but persistence and transport must serialize a secret-free copy. The current hardening path stores the key separately under `fud-ai-private-ai-key-<userId>`, clears it from the state blob, and strips it again at the server boundary.

| Field path | Shape | Class | Authority and notes |
|---|---|---|---|
| `onboarded` | boolean | Preference | Workflow marker; validate against profile completeness rather than trusting it alone |
| `profile.name` | optional string | Sensitive | User-entered display name |
| `profile.gender` | `male`, `female`, or `other` | Sensitive | Calculation input; differs from mobile's two-value `sex` field |
| `profile.birthday` | `YYYY-MM-DD` string | Sensitive | Age-gate input |
| `profile.heightCm` | number | Sensitive | Profile measurement |
| `profile.weightKg` | number | Sensitive | Current profile measurement; weight history is separate |
| `profile.activityLevel` | enum including `extraActive` | Sensitive | Calculation input; mobile lacks `extraActive` |
| `profile.goal` | `lose`, `maintain`, or `gain` | Sensitive | Calculation input |
| `profile.bodyFatPercentage` | optional number | Sensitive | Calculation input |
| `profile.weeklyChangeKg` | optional number | Sensitive | Requested rate; must be revalidated |
| `profile.goalWeightKg` | optional number | Sensitive | Must pass BMI refusal rules |
| `profile.customCalories` | optional number | Sensitive | Input, not an approved output; must pass the shared calculation path |
| `profile.customProtein` | optional number | Sensitive | User target input |
| `profile.customFat` | optional number | Sensitive | User target input |
| `profile.customCarbs` | optional number | Sensitive | User target input |
| `profile.soundEnabled` | optional boolean | Preference | Local feedback preference |
| `profile.hapticsEnabled` | optional boolean | Preference | Local feedback preference |
| `profile.trackingPaused` | optional boolean | Sensitive | Safety/off-ramp state |
| `foodEntries[]` | array | Sensitive | Authoritative meal history |
| `foodEntries[].id` | UUID-like string | Sensitive | Preserve as the client mutation ID |
| `foodEntries[].name` | string | Sensitive | User food content; prohibited in analytics |
| `foodEntries[].calories/protein/carbs/fat` | numbers | Sensitive | User-reviewed nutrition values |
| `foodEntries[].timestamp` | ISO string | Sensitive | Preserve the instant and derive local day only with an explicit zone |
| `foodEntries[].emoji` | optional string | Preference | Presentation metadata |
| `foodEntries[].source` | source enum | Sensitive | Product-method metadata; do not place food text beside it in telemetry |
| `foodEntries[].mealType` | meal enum including `other` | Sensitive | Mobile lacks `other` |
| `foodEntries[].servingSizeGrams` | optional number | Sensitive | User-reviewed serving value |
| `foodEntries[].ingredients[]` | optional array | Sensitive | Each row contains `item`, `grams`, `calories`, `protein`, `carbs`, and `fat` |
| `weightEntries[]` | `{ id, date, weightKg }[]` | Sensitive | Authoritative history; absent from the current Expo schema |
| `exerciseEntries[]` | `{ id, name, emoji, caloriesBurned, durationMinutes, timestamp }[]` | Sensitive | Authoritative activity history; absent from the current Expo schema |
| `favoriteMeals[]` | array | Sensitive | Saved meal objects with `id`, name, macros, optional emoji/grams/ingredients, and meal type |
| `chatMessages[]` | `{ id, role, content, timestamp }[]` | Sensitive | Private coach content; migration should require explicit disclosure |
| `aiSettings.provider` | provider enum | Preference | May sync only if the product decision permits |
| `aiSettings.model` | string | Preference | May sync only if the product decision permits |
| `aiSettings.customInstructions` | optional string | Sensitive | May contain private text; keep out of analytics and review before sync |
| `aiSettings.apiKey` | string | Secret | Runtime-only compatibility field. Persist separately on the device; it must never sync, enter logs, analytics, crash reports, or ordinary export |
| `gamification.xp` | number | Derived | Recompute or verify from accepted events |
| `gamification.level` | number | Derived | Recompute from XP |
| `gamification.streakFreezes` | number | Derived | Compare with the freeze ledger/policy |
| `gamification.freezeUsedDates[]` | local-date strings | Sensitive | Migration input for freeze reconciliation |
| `gamification.freezeEarnedMonth` | `YYYY-MM` string | Derived | Recompute under the current policy |
| `gamification.xpEvents[]` | `{ id, key, xp, label, timestamp }[]` | Sensitive | Dedup keys and audit input; labels are display content |
| `gamification.pendingLevelUp` | number or null | Derived | Ephemeral presentation state; do not migrate |
| `gamification.seenBadgeIds[]` | string array | Preference | May migrate after legacy-key merge |
| `gamification.quest` | optional object | Derived | Contains `date`, `type`, `target`, `progress`, `completedAt`, and optional `beforeHour`; regenerate/verify by local day |

## Other web browser stores

| Key | Shape | Class | Current lifecycle |
|---|---|---|---|
| `fud-ai-web-state` | legacy raw `AppState` | Sensitive plus Secret | Copied into the per-user key and immediately removed when no per-user state exists |
| `fud-ai-private-ai-key-<userId>` | raw provider API key | Secret | Device-local compatibility store; removed when cleared and excluded from AppState export/transport |
| `fud-ai-local-users` | email-keyed `{ sub, email, name, passwordHash, salt, createdAt }` records | Secret | Local-only email/password database |
| `fud-ai-auth-session` | `{ sub, email, name, picture?, provider? }` | Sensitive | Removed on sign-out |
| `fud-ai-auth-token` | bearer JWT | Secret | Stored in `localStorage`; removed on cloud sign-out |
| `fud-analytics` | newest-first event rows with `at` timestamp, capped at 200 | Pseudonymous | Local ring buffer; no schema version |
| `fud-notify-log` | `{ date, kinds[] }`, where kind is `routine`, `save`, or `freeze` | Preference | Replaced as the local day changes |
| `fud-seen-badges` | badge-ID string array | Preference | Legacy side store; partially normalized into `AppState` |

Browser storage currently has no schema-version key, migration ledger, checksum, retained rollback copy, or corruption quarantine.

## Expo SQLite

The database name is `calorie-tracker.db`. Drizzle migration `0000_lazy_nova.sql` creates six product tables plus Drizzle's migration metadata.

| Table | Columns | Class | Authority and notes |
|---|---|---|---|
| `profile` | `id`, `name`, `date_of_birth`, `sex`, `height_cm`, `weight_kg`, `activity_level`, `goal`, `weekly_rate_pct`, `timezone`, `daily_kcal_target`, `protein_g_target`, `carbs_g_target`, `fat_g_target`, `sound_enabled`, `haptics_enabled`, `tracking_paused`, `created_at` | Sensitive, Preference, Derived | Single profile row; calculated target columns must be revalidated rather than trusted during cross-client migration |
| `foods` | `id`, `name`, `brand`, `serving_label`, `serving_grams`, `kcal`, `protein_g`, `carbs_g`, `fat_g`, `source`, `is_favorite`, `last_used_at` | Sensitive | Mixes built-in and custom food catalog rows; built-ins should not be uploaded as user records |
| `meal_entries` | `id`, `food_id`, `custom_name`, `servings`, `kcal`, `protein_g`, `carbs_g`, `fat_g`, `meal_slot`, `logged_at_utc`, `local_date` | Sensitive | Authoritative meal history; `local_date` is deliberately stored at write time |
| `points_ledger` | `id`, `delta`, `reason`, `local_date`, `created_at` | Sensitive | Append-only authoritative event ledger for points; total is derived |
| `streak_freezes` | `id`, `granted_local_date`, `consumed_local_date` | Sensitive | Freeze ledger |
| `quests` | `id`, `local_date`, `type`, `target`, `progress`, `completed_at` | Sensitive, Derived | Daily quest state; verify against deterministic generation |

The Expo schema currently has no weight-history, exercise, coach-chat, ingredient-line, device, sync-queue, tombstone, migration-ledger, or secure-token table. Secrets must not be added to SQLite; future tokens belong in platform-protected secure storage.

## Current server destination

`web/db/schema.sql` contains `users` and `user_states`. `user_states.state` is an unversioned JSONB blob. It is not a field-level synchronization schema and currently has no idempotency key, device ID, tombstone, cursor, per-record version, or migration ledger.

## Review triggers

Update this inventory whenever a persisted field, browser key, SQLite column, secure-store entry, analytics envelope, server entity, export field, or deletion behavior changes.
