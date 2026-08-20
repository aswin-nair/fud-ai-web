# ADR 0002: Staged launch and locked product decisions

- Status: Accepted
- Date: 2026-08-20
- Owners: Product and engineering

## Context

The repository is substantially stronger than a prototype, but it is not
production-ready. Release evidence in `docs/release/evidence.json` remains
pending. Attractive features added now would compete with unfinished
authentication, migration, observability, and the mobile data lifecycle.

This ADR locks the six product decisions that prevent months of conflicting
implementation. It does not approve a public launch.

## Decision

1. **Release web before mobile.**  
   The first controlled beta is the web product. Expo `mobile/` stays in
   private alpha until account sync, export, deletion, and resumable
   onboarding are complete. Native `ios/` and `android/` remain outside this
   launch track.

2. **Launch with BYOK AI only.**  
   Managed Premium AI stays disabled and fail-closed. Do not accept
   subscription revenue for it until entitlement verification and server-side
   quota controls exist.

3. **New accounts only for the first cloud beta.**  
   Do not silently migrate existing local data. Offer migration only after the
   explicit preview / export / rollback workflow is complete.

4. **Treat cloud as multi-device.**  
   Whole-snapshot synchronization may support an invite-only beta. The public
   product must move toward entity-level synchronization.

5. **Use privacy-preserving telemetry.**  
   Analytics and crash reports must not contain food descriptions, body
   measurements, photos, chat content, birth dates, API keys, or bearer tokens.

6. **No production-ready or “Phantom-grade” label until evidence passes.**  
   Implementation completion is not release approval. `docs/release/evidence.json`
   is the authoritative ledger.

## Consequences

### Positive

- Web certification is unblocked without waiting on mobile parity.
- Premium messaging cannot drift back into the product while the endpoint is
  disabled.
- Local users are not silently uploaded.
- Later entity sync has an explicit destination.

### Costs and risks

- Mobile remains unshipped until Phases 1 and 5 complete.
- Snapshot sync will need a compatibility period (Phase 4.5).
- Existing local profiles will need a later, consented migration.

## Rejected alternatives

- Ship web and mobile together: rejected because mobile still lacks production
  accounts and sync.
- Enable Premium for launch revenue: rejected because entitlement and quota
  controls do not exist.
- Auto-migrate local data on first sign-in: rejected because it can attach the
  wrong history to an account.
- Call the current tree production-ready: rejected because every formal gate
  is still pending.

## Verification

This ADR is in force when:

- a follow-up ADR or Phase 1 change removes active Premium availability claims;
- cloud beta docs state new accounts only;
- telemetry redaction tests reject the sensitive fields listed above; and
- `release:check` still fails while any evidence gate is pending.
