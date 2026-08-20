# Data retention schedule

- Owner: Security/privacy owner and backend owner
- Approved baseline: 2026-08-20
- Review cadence: quarterly and before every provider or schema change
- Scope: browser app, Vercel API, Neon, BYOK AI providers, future telemetry, and backups

This is the product retention contract. “Disabled” means Fud AI does not yet
collect the category remotely; enabling it requires a privacy review, matching
public disclosure, an access owner, and an enforced deletion job.

| Data category | Active retention | Deletion/expiry behavior | Enforcement status |
|---|---|---|---|
| Account identity (`users`) | Until authenticated account deletion | Deleted transactionally with dependent state, sessions, mutation history, and reset tokens | Implemented; production-like rehearsal pending |
| Cloud application snapshot (`user_states`) | Until replacement or account deletion | Each save replaces the prior snapshot; account deletion cascades immediately | Implemented; backup expiry is provider-dependent |
| Browser/IndexedDB application state and outbox | Until confirmed sync, explicit data reset, or account deletion on that device | Per-account state, queue, fallback, and recovery copies must all be removed after confirmed deletion | Implemented in client; rehearsal pending |
| Device-local BYOK key | Until replacement, explicit data reset, account deletion, or browser-site-data removal | Never uploaded, exported, logged, or included in analytics | Implemented; release audit must show zero cloud matches |
| Auth session records | Active for at most 30 days | Revoked/expired records retained no more than 30 additional days for security operations, then purged | Cleanup command implemented; scheduler evidence pending |
| State mutation/idempotency ledger | 90 days | Purged after 90 days; account deletion cascades immediately | Cleanup command implemented; scheduler evidence pending |
| Entity rows, tombstones, and device cursors | Until replacement, tombstone, or account deletion | Cascade on account deletion; live product still uses snapshots | Schema implemented; projection disabled |
| Entity mutation/idempotency ledger | 90 days | Purged after 90 days; account deletion cascades immediately | Cleanup command implemented; scheduler evidence pending |
| Expo sync outbox and device cursor | Until ack, local deletion, or account-session clear | Cleared by local delete; never holds refresh or access tokens | Schema implemented; upload disabled |
| Migration ledger (`migration_attempts`) | Counts and checksums only | Terminal stages purged after 90 days; no food text or chat | Cleanup command implemented; upload disabled |
| Password reset token hash | Valid for 30 minutes | Plain token is never stored; consumed/expired hashes retained no more than 7 days, then purged | Primitive and cleanup implemented; email delivery endpoint disabled |
| Rate-limit bucket hashes | Up to 24 hours after last activity | HMAC-derived keys only; purged after 24 hours idle | Cleanup command implemented; scheduler evidence pending |
| Food, weight, exercise, favorites, and Coach messages | Part of device/cloud application state until user deletion | Replaced by later snapshots or deleted with the account/data reset | Implemented; backups may persist until backup expiry |
| Food-log drafts | Until successful log or explicit data/account deletion | Per-account browser drafts only; photo bytes are never persisted by Fud AI | Implemented; clear-path test required |
| Selected photo bytes | Request/session memory only | Fud AI does not persist photos; direct BYOK provider processing and retention follow the provider chosen by the user | Implemented client-side; provider policy links remain the user-facing source |
| Device-local product analytics | Newest 200 allowlisted events | Cleared by explicit data/account deletion or browser-site-data removal | Implemented locally |
| Remote product analytics | Disabled | No remote retention until a reviewed sink and schedule are approved | Not enabled |
| Device-local crash reports | Newest 200 sanitized crash names | Cleared by explicit data/account deletion; no message, stack, or application state | Implemented locally |
| Crash reports and remote application logs | Disabled beyond platform/provider defaults | Must exclude sensitive payloads and use a separately approved retention period before enablement | Remote sink not enabled |
| Database backups | Proposed maximum 30 days | Deleted account data may remain inaccessible in encrypted backups until backup expiry; restore procedures must reapply deletion reconciliation | Provider configuration and rehearsal pending |
| Security/deletion audit events | Proposed 90 days, metadata only | No raw user state, email, food content, tokens, or IP addresses | Provider/sink not yet enabled |

## Operator controls

Run the count-only BYOK check before release:

```text
npm.cmd run db:audit-byok --prefix web
```

Schedule the non-content retention cleanup at least daily:

```text
npm.cmd run db:retention-cleanup --prefix web
```

Both commands redact provider errors. Store only candidate ID, commit SHA, UTC
time, exit code, and aggregate counts in release evidence. Never attach database
URLs, row values, emails, account IDs, or application snapshots.

## Change rule

Any new storage key, table, upload, telemetry field, subprocessor, backup class,
or legal hold requires updates to this schedule, the local-data inventory,
privacy/terms copy, threat model, deletion tests, and release evidence before it
is enabled in production.
