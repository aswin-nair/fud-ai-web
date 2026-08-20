# Phase 8: privacy-safe observability

This records the repo-side Phase 8 foundation. It is not a hosted dashboard,
not a connected analytics or crash provider, not a staging alert drill, and
not a release approval. `docs/release/evidence.json` stays unassigned with
every gate pending.

## What landed

- `@fud-ai/contracts` now owns the versioned telemetry envelope. Unknown
  fields are rejected. Food text, photos, body measurements, chat, email,
  tokens, database URLs, and provider keys cannot survive serialization.
- Product events use the canonical names. Legacy `freeze_applied` and
  `streak_extended` names are no longer emitted.
- The web sink is still a device-local ring buffer. A second local buffer
  stores sanitized crash names only. The remote sink stays fail-closed.
- API handlers emit one allowlisted `api_request` line with request ID,
  route template, method, status, duration bucket, release, and result
  class. Bodies, headers, emails, and SQL stay out.
- `/api/gemini` records `managed_ai_invoked` on the fail-closed 503 so an
  unexpected enablement is visible in logs.
- The alert catalog exists as code. Every owner is `UNASSIGNED` and the
  sink is `disabled` until privacy review.

## Still uncertified

- A reviewed remote product-analytics or crash provider.
- Hosted dashboards, paging, and a staging alert drill to a named owner.
- Provider region, retention, subprocessor, and deletion-linkage approval.
- Crash-free session measurement on a real cohort.
- Any evidence gate in `docs/release/evidence.json`.
