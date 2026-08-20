# ADR 0003: Critical path before new product features

- Status: Accepted
- Date: 2026-08-20
- Owners: Engineering

## Context

The staged launch plan (ADR 0002) names authentication, migration,
observability, and the mobile data lifecycle as incomplete. Feature work in
logging quality, insights, coaching style, health integrations, or
international expansion would delay a trustworthy beta.

## Decision

Do not start post-launch product development until the foundation work in
Phases 0–10 of the staged launch plan has produced a candidate that can enter
internal dogfood.

The critical path is:

1. Integrate and verify the current tree (Phase 0).
2. Reconcile managed-AI messaging (Phase 1.1).
3. Finish real mobile local export/delete and onboarding resume (Phase 1.2–1.3).
4. Certify the cloud deployment path (Phase 2).
5. Replace the browser session design and implement recovery (Phase 3).
6. Establish entity contracts and migration (Phase 4).
7. Implement mobile account sync using those contracts (Phase 5).
8. Finish accessibility and shared policy extraction (Phases 6–7).
9. Activate privacy-safe observability (Phase 8).
10. Rehearse retention, backup, restore, migration, and deletion (Phase 9).
11. Automate release evidence (Phase 10).
12. Run internal and invite-only beta cohorts (Phase 11).

## Consequences

New barcode, insight, coaching, HealthKit, or localization work requires an
explicit ADR that names which critical-path item it does not block.

## Verification

A pull request that adds a post-launch feature without that ADR is out of
scope until Phase 11 dogfood has started.
