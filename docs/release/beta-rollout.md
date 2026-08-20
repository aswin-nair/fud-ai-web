# Beta and production rollout

Rollout is cohort-based. A successful build is not permission to skip a cohort.

## Cohorts

| Cohort | Audience | Minimum observation | Promotion requirement |
|---|---|---|---|
| Internal | Team and invited synthetic-data testers | 3 staffed days | No P0/P1; core rehearsals complete |
| 5% | Consenting beta users | 7 days | All launch metrics within gates; no safety signal |
| 20% | Beta users | 7 days | Second clean weekly cohort and support capacity confirmed |
| 50% | Production users | 7 days | No regression in activation, persistence, crashes, deletion, or support |
| 100% | Production users | Continuous | Incident/on-call coverage active; daily first-week review |

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

Any P0, unresolved P1, unsafe target/age/streak behavior, cross-user access,
credential exposure, ambiguous destructive deletion, data-loss evidence, crash
gate breach, or material privacy mismatch stops promotion. Follow
`docs/operations/incident-runbook.md`; do not average a severe event away inside
an otherwise healthy aggregate.

## Experiment policy

Do not run launch-critical experiments during incident recovery. After general
availability, run one meaningful onboarding/logging experiment at a time, keep
safety and privacy behavior invariant, pre-register the hypothesis/guardrails,
and stop on a negative safety, persistence, or comprehension signal.
