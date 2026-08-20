# Phase 6–7: shared policy and web accessibility

This records the repo-side Phase 6 policy extraction and Phase 7 primary-web
accessibility work. It is not a WCAG audit, not a VoiceOver or TalkBack pass,
and not a release approval. `docs/release/evidence.json` stays unassigned with
every gate pending.

## What landed

- `@fud-ai/domain` now owns meal-slot defaults, freeze planning, notification
  eligibility, web XP award eligibility, and quest seeding.
- The same JSON fixtures run on web, the API process, and mobile for calendar
  zones, meal slots, freezes, notifications, and quest stability.
- Contracts re-export the shared IANA calendar helpers instead of keeping a
  private fork.
- Primary web journeys use a real photo-upload button, named settings
  controls, dialog focus handling, live error and save status, and visually
  hidden chart and consistency summaries.

## Recorded exceptions

- Nutrition target adapters stay client-specific. Activity multipliers, rate
  units, sex options, and macro math still need an explicit product and
  clinical decision.
- Web still derives a local day from the device zone at read time. Mobile
  stores the IANA day at write time.
- XP amounts and level curves stay on the web constants. Mobile keeps its
  quadratic points ledger.
- Mobile quests keep a fourth candidate slot so legacy `hit_protein` dates
  stay stable.
- Web freeze planning also treats pause days as extra coverage. Mobile does
  not pass that argument.
- Notification delivery stays a web browser adapter. Mobile has no scheduler.

## Still uncertified

- Converged target math.
- A versioned web `localDate` field and travel-stable migration.
- VoiceOver, TalkBack, zoom, and forced-colors device-matrix evidence.
- Any evidence gate in `docs/release/evidence.json`.
