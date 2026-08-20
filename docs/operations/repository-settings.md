# Repository and release protection settings

These controls require a GitHub repository administrator and cannot be enforced
by files alone.

## Required settings

- Enable dependency graph, Dependabot alerts/security updates, code scanning,
  secret scanning, and secret-scanning push protection.
- Protect `main`/`master`: pull request required, at least one independent review,
  stale approvals dismissed, conversation resolution required, force pushes and
  deletion blocked.
- Require Product CI, Security CI, and hosted browser checks before merge.
- Restrict workflow changes and production environment approvals to named roles.
- Give CI, Vercel, Neon, analytics, crash, and AI credentials least privilege;
  use separate development/staging/production values and rotate on ownership
  changes or exposure.
- Require signed/tagged release candidates and retain build artifacts, test
  reports, schema version, release notes, and evidence ledger.

Record screenshots or exported settings, repository URL, reviewer, and date in
the operations release evidence. Recheck quarterly and after ownership changes.
