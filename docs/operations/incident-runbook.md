# Incident and rollback runbook

Status: executable template; named people and communication channels must be
assigned before a public cohort.

## Severity

| Level | Examples | Initial response |
|---|---|---|
| P0 | Cross-user access, credential exposure, destructive data loss, unsafe target bypass | Stop rollout immediately; incident lead in 15 minutes |
| P1 | Widespread login/sync failure, deletion unavailable, crash loop, corrupted migration | Freeze rollout; incident lead in 30 minutes |
| P2 | Degraded AI provider, isolated UI regression, delayed non-destructive sync | Triage during staffed hours |

## Roles to assign

- Incident lead: `UNASSIGNED`
- Technical lead: `UNASSIGNED`
- Privacy/security decision owner: `UNASSIGNED`
- Support/communications owner: `UNASSIGNED`
- Vercel and Neon administrators: `UNASSIGNED`

No public release is allowed while any required role is unassigned.

## Universal response

1. Open a timestamped incident record without copying user food, weight, photo,
   chat, token, or API-key content into it.
2. Stop the rollout. Disable the affected feature flag or promote the last known
   good deployment. Do not run an irreversible database rollback.
3. Record candidate SHA, deployment ID, schema version, first observed time,
   affected route/client versions, and aggregate impact.
4. Preserve redacted logs and database metadata. Restrict access to the minimum
   response team.
5. Reproduce with synthetic accounts and data.
6. Patch, test the failure and recovery paths, and deploy to an internal cohort.
7. Resume only after the incident lead and relevant security/privacy owner sign
   the evidence record.
8. Publish a blameless review within five working days for P0/P1 incidents.

## Specific playbooks

### Cross-user state or session mix-up

- Disable cloud writes and new sessions.
- Revoke affected sessions; do not rely only on client sign-out.
- Query authorization and idempotency metadata using synthetic-safe identifiers.
- Determine whether another user's state was read, written, exported, or deleted.
- Treat confirmed access as a privacy/security incident and follow the applicable
  notification process.

### BYOK material found server-side

- Stop cloud writes and restrict database access.
- Run the secret-removal migration and independently query every active and
  dormant state row, backup/branch, and log destination in scope.
- Do not display recovered values. Record counts and irreversible hashes only.
- Decide provider-key rotation and user notification with the privacy/security
  owner. A zero-row result is still retained as release evidence.

### Sync loss or conflict spike

- Keep local outboxes intact; never instruct users to clear browser storage.
- Pause destructive actions and server migrations.
- Compare mutation IDs, base/result versions, outbox age, and aggregate conflict
  counts using synthetic or redacted identifiers.
- Restore service, drain a synthetic offline queue twice, and prove each mutation
  applied once before resuming rollout.

### Migration failure

- Stop the migration and application rollout.
- Preserve the pre-migration snapshot/branch.
- Compare row counts, versions, required fields, and collection checksums.
- Prefer a forward repair. Restore only after proving the target snapshot and
  documenting writes that occurred after the backup point.

### AI provider outage

- Keep manual logging available and preserve drafts.
- Disable only the unavailable provider path; do not block Home or history.
- Use factual status copy and avoid repeated automatic requests that consume a
  user's quota.

## Required evidence

Attach the rehearsal or incident record to the corresponding gate in
`docs/release/evidence.json`. Evidence must show timestamps, owners, synthetic
test data, commands/checks performed, recovery result, and follow-up actions.
