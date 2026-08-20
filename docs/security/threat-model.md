# Threat model

- Status: Initial Phase 0 model
- Last reviewed: 2026-08-20
- Applies to: `web/app`, `web/api`, `web/db`, `mobile`, planned analytics/sync, export, and deletion
- Verification basis: OWASP ASVS for web/backend and OWASP MASVS for mobile

## Release-blocking historical-state check

The original whole-state design allowed runtime `AppState.aiSettings.apiKey` to reach `user_states.state` when Neon mode was enabled. The current hardening path stores the key under a separate device-local key, serializes a secret-free state for local persistence/export/network transport, rejects keys at the API boundary, strips them again on the server, bulk-purges them during the database migration, and removes an embedded key when a row is read as defense in depth.

Before treating this mitigation as complete:

1. do not enable or expand Neon state sync until client and server secret-rejection tests pass;
2. determine whether production or preview `user_states` rows contain historical `aiSettings.apiKey` values, including dormant rows that may not be read by the purge-on-load path;
3. if they do, treat the result as a security incident: limit access, preserve only necessary audit evidence, purge the secret material, and decide the user-notification/rotation response; and
4. add a regression test proving secrets cannot enter persistence, sync, logs, analytics, or crash reports.

This document does not assert that keys have already been stored; that depends on deployed configuration and user state.

## System and trust boundaries

1. Browser process and DOM: renders personal data and executes application/third-party JavaScript.
2. Browser storage: holds app state, local account records, a session descriptor, bearer token, BYOK settings, notification state, and local analytics.
3. Google identity boundary: returns an identity credential to the browser and is verified by the API in cloud mode.
4. Vercel API boundary: authenticates bearer tokens and reads/writes Neon.
5. Neon boundary: currently stores users and an opaque JSON app-state blob.
6. AI-provider boundary: browser sends text or images directly with the user's provider key in BYOK mode.
7. Export/import boundary: JSON leaves or enters the application through a user-controlled file.
8. Expo device boundary: SQLite contains profile, meals, food records, and gamification ledgers; future tokens require platform secure storage.
9. Future telemetry/crash boundary: must receive only an allowlisted, pseudonymous contract.
10. CI/release boundary: GitHub Actions installs dependencies, builds artifacts, and runs release gates.

## Assets

- Account identity, password verifier, OAuth credential, bearer session, and future recovery factors.
- BYOK provider keys and future managed-provider credentials.
- Birthday, height, weight, goals, food and exercise history, coach messages, and photos.
- Safety-calculation inputs, outputs, and structured explanation reasons.
- Meal, XP, streak, freeze, quest, export, and deletion integrity.
- Availability of manual logging and recoverability of accepted local entries.
- Analytics privacy and the accuracy of public privacy disclosures.
- Build credentials, dependency integrity, and release provenance.

## Threat register

| ID | Threat and affected boundary | Existing control | Gap / required mitigation | Severity | Required evidence |
|---|---|---|---|---|---|
| TM-001 | BYOK key reaches Neon through whole-state sync | Client secret-free serializer, separate device-local key, strict API rejection, server-side stripping, bulk migration purge, and purge on load are present in the hardening path | Run the migration, inspect historical/dormant rows in every deployed environment, rotate or notify if exposure is confirmed, and prevent future DTOs from representing the key | Critical | Serialization and API rejection tests using canary secret values; migration output plus post-purge storage query |
| TM-002 | XSS or compromised third-party script reads bearer token, BYOK key, and health-adjacent state from `localStorage` | React escapes normal text rendering | Adopt a restrictive CSP, remove long-lived secrets from ordinary browser storage where feasible, inventory all scripts, and test unsafe rendering paths | High | CSP report/test, dependency/script inventory, DOM-XSS tests |
| TM-003 | Malformed or oversized `PUT /api/state` corrupts state or consumes storage/compute | API requires a bearer token, enforces a strict nested allowlist with type/range/collection limits, and rejects payloads above 2 MB | Add request-rate/body-stream limits and fuzz the parser/contract with adversarial payloads | High | Boundary tests are present; add fuzz, rate-limit, and payload-limit integration evidence |
| TM-004 | A failed cloud read or stale write overwrites valid remote history | Hydration blocks mutations after a failed/timeout read; saves are ordered and version-preconditioned; conflicts and failures are surfaced | Add a durable offline mutation queue/relaunch recovery and exercise forced timeout/500/ambiguous-commit cases against a production-like database | Critical | Unit policy coverage plus integration tests proving zero destructive writes and no accepted local entry loss |
| TM-005 | Cross-user object access through API authorization failure | State API derives user ID from verified JWT subject rather than request body | Keep object authorization server-side for every future entity and test ID substitution | Critical | Two-account negative authorization suite for every endpoint |
| TM-006 | Session theft/replay or account takeover | Short-lived `use: access` JWT in memory; rotating hashed refresh cookie; family replay revocation; logout, logout-all, password change, and deletion revoke sessions; scrypt cloud passwords; HMAC rate-limit keys; provider-collision refusal | Local development auth still stores password verifiers in browser storage; hosted cookie/replay evidence is still required | High | Staging expiry/revocation, refresh-replay, and cross-tab tests; external review |
| TM-007 | Duplicate/replayed meal mutation awards duplicate XP or corrupts streak | Web keeps an untruncated award-key ledger and replay tests; mobile points ledger is append-only | Future API needs client mutation ID, idempotency key, server validation, transaction boundaries, and cross-device replay tests | High | Concurrent/replay integration tests and ledger reconciliation |
| TM-008 | Malicious or oversized image, metadata, or prompt injection crosses the AI boundary | Current BYOK call is user initiated and results are reviewed before logging | Validate type/size, strip EXIF for managed uploads, isolate untrusted prompt content, validate structured output, define retention/deletion, preserve manual fallback | High | Malformed-file corpus, EXIF test, prompt-injection cases, retention job evidence |
| TM-009 | Sensitive values enter analytics, crash reports, or server logs | Analytics uses a typed versioned allowlist and rejection tests; ordinary state paths do not log payloads | Apply equivalent redaction/canary tests to the future production analytics and crash sinks | Critical | Existing client tests plus future API/log/crash-sink redaction evidence |
| TM-010 | Export unintentionally includes secrets/private chat, or import overwrites good data | Export strips BYOK; import uses the strict contract; malformed local data is retained in a quarantine copy | Disclose included private categories, add import preview/versioning and a user-facing quarantine/rollback recovery path | High | Export allowlist, malicious import, round-trip, preview, and rollback tests |
| TM-011 | Delete UI resets visible state but leaves account, auxiliary browser stores, backups, or server data | Reset and account deletion are separate; reset awaits snapshot acknowledgement; authenticated typed account deletion cascades user-owned server rows and clears IndexedDB/fallback/recovery/draft/BYOK/onboarding/notification/analytics stores | Production-like database/browser/backup rehearsal and provider backup-expiry evidence remain required | High | End-to-end deletion test with database, browser stores, backup/retention, and UI assertions |
| TM-012 | Lost/unlocked device exposes Expo SQLite or notification content | OS application sandbox; notification copy avoids calories/weight | Use secure storage for small tokens, optional local app lock with recovery behavior, minimize lock-screen content, document device-risk limits | Medium | MASVS storage review, lost-device scenario, notification snapshot tests |
| TM-013 | Dependency or CI compromise changes release artifacts | GitHub Actions uses clean checkout and `npm ci` | Pin/review actions and dependencies, least-privilege permissions, secret scanning, protected branches, signed builds, and provenance | High | Required checks, branch ruleset, dependency review, secret scan, artifact/provenance record |
| TM-014 | Privacy or security disclosure contradicts deployed accounts/cloud behavior | Privacy and security disclosures now distinguish mobile local-only behavior from browser local/cloud modes, document Vercel/Neon account state, preserve the device-only BYOK boundary, and describe export/reset limits; the deployment guide documents Neon mode | Treat disclosures as a release-controlled contract: compare deployed flags, data fields, providers, retention, export, and deletion behavior with privacy, security, terms, and in-product copy before every release | High | Completed release checklist plus a snapshot of the reviewed deployed disclosures and data-flow configuration |
| TM-015 | Admin/support access exposes meal or account data without accountability | No admin surface is documented | Define least-privilege roles, break-glass process, metadata-only audit events, retention, and user-support boundaries before tooling exists | High | Role tests, access review, immutable audit-event samples, incident drill |

## Security invariants

- A client-supplied user ID never authorizes an object.
- BYOK keys, passwords, session tokens, raw photos, food text, and chat text never enter analytics or ordinary logs.
- BYOK keys never enter account sync.
- Every accepted mutation is idempotent and can be retried without duplicate XP.
- A failed read cannot enable a destructive write.
- Target and gamification outputs are recomputed or validated by the trusted shared domain.
- Manual logging remains available during AI, sync, or network failure.
- Export and deletion enumerate the same data inventory and have testable completion states.
- Destructive operations require fresh authorization appropriate to risk.

## Required follow-up decisions

Separate ADRs are required for:

- managed identity, session duration, recovery, account linking, and revocation;
- BYOK versus managed AI mode and photo retention;
- account-backed entity/sync design and local rollback window;
- analytics provider, lawful/privacy basis, event retention, and deletion linkage; and
- supported clients/platforms and secure-store behavior.

## Review cadence

Review this model before backend/schema work, before enabling production analytics or managed uploads, after any auth/export/deletion change, after a material incident, and before each public mobile release. Every open Critical or High item needs an owner, target milestone, verification link, and explicit disposition.
