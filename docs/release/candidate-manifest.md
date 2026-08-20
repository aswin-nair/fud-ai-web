# Candidate manifest

This file records the Phase 0 integration commit. It is not a release
approval. `docs/release/evidence.json` stays unassigned with every gate
pending until durable evidence exists.

## Identity

| Field | Value |
|---|---|
| Integration commit | `67b936c6f7b93a9874f5fe8051be4c30b799f0f9` |
| Branch | `main` |
| Recorded | 2026-08-20 |
| Host | Windows 10, Node v24.14.1, npm 11.11.0 |
| Expo SDK | `~57.0.13` (`mobile/package.json`) |

`evidence.json` must remain `candidate.commit: "unassigned"` until a named
owner attaches gate evidence. `npm run release:check` without
`--structure-only` must fail.

## Lockfiles and schema

`packages/domain` is a source-only workspace package and has no lockfile.
The API shares `web/package-lock.json`.

| Artifact | SHA-256 |
|---|---|
| `web/app/package-lock.json` | `6efa942fcbb8604f2b3c28ad55ba94ba00b6395046beacf86e32b0388c66b2b4` |
| `web/package-lock.json` | `36c6906e40b40a841d6ff477726020abefa73d647995048f460d63c1b1d95110` |
| `mobile/package-lock.json` | `4b99dccdaa0c689f91a764bb3440fc86b235918f2d26deaefba065cc465590b8` |
| `packages/domain/package.json` | `3ebdb861c495ab65376eb18df1d3b5acab248020b82b13a5c37fd95aa4168671` |
| `web/db/schema.sql` | `2fd1f659fc0683854cd34d119dff570f1d71a4cb00c7b79d1c1f529c088558ca` |
| `web/db/migrations/20260820_account_security.sql` | `08cbd42536fc1ad57edc0af5bf63bffb83c4e475201ce57da1692c94431da66e` |

Domain package identity is `packages/domain/package.json` version `0.1.0`
at the integration commit. There is no domain lockfile to hash.

## Build mode

This baseline used the explicit local backend:

```text
npm run build:local --prefix web/app
```

`VITE_DATA_BACKEND=local`. The cloud command (`npm run build:cloud`,
`VITE_DATA_BACKEND=neon`) exists but was not certified against a hosted
Neon environment in this baseline.

A missing backend argument now fails the build script. The running app
still defaults to `local` when `VITE_DATA_BACKEND` is unset
(`web/app/src/lib/dataBackend.ts`). That silent default is a Phase 2
item, not a Phase 0 pass.

## Disabled feature flags

| Flag | State |
|---|---|
| Managed Premium AI (`/api/gemini`) | Fail-closed. GET and POST return `503` with `managed_ai_unavailable` before install-ID, quota, or provider work. |
| Subscription revenue for managed AI | Not accepted. |
| Local-to-cloud silent migration | Not implemented. First cloud beta is new accounts only (ADR 0002). |
| Phantom-grade / production-ready label | Forbidden until every evidence gate passes. |

## Local baseline

Recorded on 2026-08-20 against the integration commit plus the two
reproducibility fixes included in that commit (Windows build spawn, Home
e2e meal heading).

| Check | Result |
|---|---|
| `npm run security:scan:test` | 3 passed |
| `npm run security:scan` | passed |
| `npm run release:check:structure` | valid, 16 gates |
| `npm run support:check` | current; renew by 2026-11-20 |
| `npm run lint` (`web/app` oxlint) | passed with warnings below |
| `npm run test:web` | 23 files, **178** passed |
| `npm run build` / `build:local` | passed |
| `npm run test:e2e` | 24 passed after the meal-heading fix |
| `npm run test:api` | 14 files, **45** passed |
| `npm run typecheck:api` | passed |
| `npm run typecheck:mobile` | passed |
| `npm run test:mobile` | 14 files, **162** passed |
| `npm run release:check` | **must fail** while gates are pending |
| Clean working tree after integration | clean (`main` ahead of `origin/main` by the integration commit, then this manifest) |

Exact automated unit/API/mobile count from this machine: **385**
(178 + 45 + 162). Scanner canaries (3) and Playwright (24) are listed
separately.

## Known warnings

- oxlint Fast Refresh `only-export-components` in
  `web/app/src/store/AuthContext.tsx`,
  `web/app/src/store/AppContext.tsx` (two exports), and
  `web/app/src/components/Toast.tsx`.
- Playwright workers log `NO_COLOR` ignored because `FORCE_COLOR` is set.
- Mobile Vitest logs Node’s experimental SQLite warning.

## Environment-only failures resolved in this candidate

- `web/app/scripts/build.mjs` originally used `spawnSync('npm.cmd')`,
  which throws `EINVAL` on this Windows/Node pair. The script now
  invokes `typescript/bin/tsc` and `vite/bin/vite.js` through
  `process.execPath`.
- `e2e/home.spec.ts` required a `Breakfast` heading. Evening
  onboarding logs Dinner, so the assertion is now any meal-section
  heading (`Breakfast|Lunch|Dinner|Snack`).

## Not proven in this baseline

- Hosted Neon registration, sync, logout, and deletion.
- Password-recovery email delivery.
- Remote analytics, crash reporting, or on-call alerts.
- Browser short-lived session cookies (long-lived bearer remains).
- Mobile production auth, export, deletion, and account sync.
- WCAG / VoiceOver / TalkBack device-matrix evidence.
- Any of the 16 gates in `evidence.json`.

## Next

Phase 1.1: remove active Premium / managed-AI availability claims from
product, store, and legal surfaces while the endpoint stays fail-closed.
