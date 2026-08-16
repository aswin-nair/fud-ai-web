# Duplicate domain logic inventory

- Status: Characterization baseline
- Last reviewed: 2026-08-17
- Decision reference: `docs/adr/0001-product-source-of-truth-and-shared-domain.md`

This inventory identifies rules that appear in both TypeScript clients. It does not assume they are equivalent. Web behavior remains the current product reference until fixtures make each difference explicit.

| Domain | Web implementation | Mobile implementation | Known shape difference / extraction risk | First characterization evidence |
|---|---|---|---|---|
| Adult age and target safety | `web/app/src/lib/profile.ts` | `mobile/src/logic/nutrition.ts` | Web accepts `other` and `extraActive`, optional body fat, custom macro/calorie targets, and kilogram weekly change. Mobile uses `female/male`, percent rate, explicit time of calculation, and a success/refusal result union. Reason-code vocabularies differ. | Shared adult-boundary dates; BMR cases; 25% deficit; 1% rate; 1,200/1,500 and BMR floors; BMI 18.5 refusal; custom-target cases |
| Local calendar day | `web/app/src/lib/dates.ts` | `mobile/src/logic/dates.ts` | Web generally uses the runtime device zone and `Date`; mobile requires an explicit IANA zone and stores `LocalDate`. Travel semantics differ. | Both DST transitions, near-midnight UTC offsets, leap day, travel with a persisted origin day |
| Base streak | `web/app/src/lib/streak.ts` and `journey.ts` | `mobile/src/logic/streak.ts` | Web derives from full `FoodEntry` timestamps and adds journey/badges; mobile derives from stored local dates and exposes at-risk state. | Empty/one-day histories, gaps, today/yesterday boundary, pause behavior, duplicate logs on one day |
| Streak freezes | `web/app/src/lib/journey.ts` and `gamification.ts` | `mobile/src/logic/freezes.ts` | Web stores counts and used dates in mutable gamification state; mobile plans against a freeze ledger. Grant counts/defaults may differ. | Month boundary, one-free-freeze policy, gap coverage, idempotent reopen/replay, pause interaction |
| XP / points and levels | `web/app/src/lib/xp.ts` and `gamification.ts` | `mobile/src/logic/points.ts` | Award amounts, level thresholds, labels, and persistence differ. Web has `xpEvents`; mobile uses an append-only points ledger. | One log, first log of day, repeat dispatch, streak milestone, level threshold, unsupported reason, replay idempotency |
| Daily quests | `web/app/src/lib/quests.ts` | `mobile/src/logic/quests.ts` | Both seed by local date, but stored shapes and progress inputs differ. Web gamification includes an optional quest; mobile has a table row. | Stable quest for date/time zone, each quest type, progress cap, completion timestamp, reopen/retry |
| Meal-slot default | `web/app/src/lib/meals.ts` | `mobile/src/logic/mealSlot.ts` | Web includes `other` and reads local device hour by default; mobile accepts an hour and has four slots. Cutoff values require comparison. | Hours immediately before/at/after every cutoff and explicit edit preservation |
| Notification eligibility | `web/app/src/lib/notifications.ts` | No equivalent pure mobile policy found | Web enforces a two-per-day browser log and three notification kinds. This must become a policy module before native scheduling consumes it. | Two/day cap, duplicate kind, local-day rollover, logged-today suppression, content ban, pause state |

## Extraction order

1. Freeze current web and mobile behavior in neutral JSON fixtures without UI or storage dependencies.
2. Classify each mismatch as a bug, intended platform difference, or product decision.
3. Extract target safety and local-day behavior first because other rules depend on them.
4. Extract streak/freezes, then XP/points and quests.
5. Extract notification eligibility separately from platform delivery.
6. Switch one client at a time while both old-vs-new characterization suites remain green.
7. Delete the private implementation only after both consumers use the package.

## Rules that remain adapters or presentation

- React/React Native state stores and hooks.
- Browser `localStorage`, Expo SQLite/Drizzle, secure storage, and future sync queues.
- Notification delivery APIs and permission prompts.
- User-facing explanation strings, mascot behavior, sounds, haptics, and navigation.
- Database row mapping and API transport.

## Exit criteria

- Every row above has cross-client fixtures and an owner for unresolved differences.
- The shared package accepts explicit time, zone, and identity inputs.
- No extracted function imports UI, storage, network, clock, or random APIs.
- A change to shared rules runs both web and mobile checks in CI.

