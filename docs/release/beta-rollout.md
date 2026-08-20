# Beta and production rollout

Rollout is cohort-based. A successful build is not permission to skip a
cohort. Repo-side kill switches and halt rules exist; no cohort is live
until a named owner sets `BETA_COHORT` and records evidence.

## Cohorts

| Cohort | Audience | Size / share | Minimum observation | Promotion requirement |
|---|---|---|---|---|
| Internal dogfood | Invited synthetic-data testers | 20–30 | Daily incident review | No P0/P1; export, delete, logout-all, offline logging, and conflict recovery exercised |
| Invite-only | Consenting beta users | 50–150 | Two complete weekly cohorts | Support, crashes, migration, sync, and recovery inside gates; stop enrollment on data-loss or cross-account issues |
| Public 5% | Production users | 5% | 7 days | All launch metrics within gates; no safety signal; review recorded |
| Public 25% | Production users | 25% | 7 days | Review recorded; no skipped step |
| Public 50% | Production users | 50% | 7 days | No regression in activation, persistence, crashes, deletion, or support |
| Public 100% | Production users | 100% | Continuous | Incident/on-call coverage active; daily first-week review |

Public steps cannot skip. Invite-only cannot jump to 25%. Internal cannot
jump to public.

## Locked beta rules

- No managed AI. `/api/gemini` stays fail-closed.
- New cloud accounts only. Local-to-cloud migration stays off.
- Cloud-write, account-creation, and fail-closed feature flags remain available.
- Set `ENABLE_CLOUD_WRITES=false` to stop state writes and account deletion.
- Set `ENABLE_ACCOUNT_CREATION=false` to stop enrollment. Existing sessions
  can still sign in.
- Internal and invite cohorts require `BETA_INVITE_HASHES` (SHA-256 of
  `pepper + newline + normalized email`). Do not store plaintext invites in
  the repo or logs.

## Mandatory thresholds

These match `docs/release/evidence.json`. They do not pass those gates.

- Eligible onboarding completion: at least 75%.
- First-session first-log rate: at least 65%.
- p75 standard logging time: at most 20 seconds.
- Crash-free sessions: at least 99.8% for two weekly cohorts.
- Accepted-entry persistence / exactly-once sync: at least 99.95%.
- No unresolved high-severity security, privacy, accessibility, or data-loss finding.

## Promote

Before each promotion, record the immutable release, cohort assignment method,
start/end times, dashboard snapshot, open defects, support themes, safety review,
and named product/engineering/quality approvers. Compare:

- eligible onboarding completion and first-session first-log;
- standard log latency and AI correction/fallback rate;
- sync backlog, conflicts, duplicate mutation replays, and accepted-entry loss;
- auth failures, deletion/export completion, API latency/errors, and crashes;
- notification counts, pause use, support opens, and safety-copy feedback.

## Hold or roll back

Stop enrollment and promotion immediately on any confirmed:

- cross-account write;
- lost accepted entry;
- secret sync;
- failed deletion;
- unsafe target, age, or streak bypass.

Also stop on any P0, unresolved P1, crash-gate breach, or material privacy
mismatch. Follow `docs/operations/incident-runbook.md`; do not average a
severe event away inside an otherwise healthy aggregate.

## Experiment policy

Do not run launch-critical experiments during incident recovery. After general
availability, run one meaningful onboarding/logging experiment at a time, keep
safety and privacy behavior invariant, pre-register the hypothesis/guardrails,
and stop on a negative safety, persistence, or comprehension signal.
