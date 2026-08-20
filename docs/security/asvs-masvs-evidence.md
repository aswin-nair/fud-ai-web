# ASVS/MASVS evidence map

This is a verification index, not a claim of certification. An independent
reviewer must record exact control identifiers, evidence links, findings, and
acceptance decisions for the release candidate.

| Area | Current repository evidence | Required external evidence | Status |
|---|---|---|---|
| Architecture/threat model | `docs/security/threat-model.md` | Reviewer sign-off and updated data-flow diagram | Pending |
| Authentication/session | API boundary tests, signed expiring sessions | Recovery, revocation, fixation, replay, credential-stuffing review | Pending |
| Authorization | Session subject scopes state access | Independent cross-user/object authorization tests | Pending |
| Input/data validation | Shared AppState contract and API tests | Fuzzing and request-size/abuse testing | Pending |
| Cryptography/secrets | Password KDF, JWT configuration checks, BYOK boundary, repository secret scan | Key rotation and secret-manager review | Pending |
| Stored data/privacy | Data inventory, migration map, BYOK purge migration | Neon/backups/logs audit and retention approval | Pending |
| Error/log handling | Stable client errors and redaction requirements | Production sink redaction tests | Pending |
| Availability/abuse | Timeout and planned rate limits | Load test and operational alert evidence | Pending |
| Mobile storage | SQLite inventory | SecureStore/keychain extraction and lost-device review | Pending |
| Mobile platform | Expo project tests | Signed-build, permissions, biometric, deep-link, backup, and screenshot review | Pending |
| Accessibility/safety | Domain/copy tests and product guardrails | Assistive-tech and clinical-safety copy review | Pending |
| Deletion/export | Browser state reset/export behavior | End-to-end account deletion, backup retention, and restore rehearsal | Pending |

Critical/high findings block release. A risk acceptance must name the decision
owner, affected candidate, expiry/review date, compensating controls, and linked
follow-up; it does not silently convert the release gate to passed.
