# ADR 0001: Product source of truth and shared domain

- Status: Accepted for Phase 1
- Date: 2026-08-17
- Owners: Product and engineering

## Context

The repository contains several product surfaces with different persistence and UI stacks:

- `web/app/`: Vite, React, and TypeScript. This is the currently shipped product and the reference implementation for the active product journey.
- `mobile/`: Expo and React Native. This is a separate, not-yet-shipped client.
- `ios/` and `android/`: existing native clients. They remain outside this extraction track; this ADR does not authorize their removal or a rewrite.
- `web/api/` and `web/db/`: the current optional Vercel and Neon account backend.

Safety, local-day, streak, XP, quest, and notification rules are currently implemented independently. Treating either UI tree as a permanent library would couple the other client to React, browser storage, Expo, or SQLite. Copying the rules would preserve the existing drift risk.

The current Vercel project is rooted at `web/`. A future root-level package therefore cannot be imported by the deployed web app until workspace and deployment resolution are changed deliberately.

## Decision

1. `web/app/` is the shipped product and the source of truth for current product behavior, journey acceptance, and rollout decisions.
2. Shared safety and gamification rules will move, after characterization, to a root package named `packages/domain`.
3. After extraction, `packages/domain` is the implementation source of truth for rules that must behave identically. `web/app/` remains the reference product surface; it does not keep a private fork of an extracted rule.
4. API, analytics, persisted-state, and migration envelopes will live in a separate `packages/contracts` package.
5. `mobile/` consumes shared packages through declared package dependencies. It must not import files from `web/app/`, duplicate shared source, or translate rules manually.
6. The two UI applications remain separate. Layout, navigation, platform integration, storage adapters, and network adapters are not shared merely to reduce file count.

## Shared-domain constraints

`packages/domain` must:

- be pure TypeScript;
- have no React, DOM, Expo, storage, SQLite, network, clock, or random-number imports;
- receive clock, time-zone, IDs, and policy inputs explicitly;
- expose deterministic inputs and outputs;
- be covered by the same characterization fixtures in web and mobile;
- keep safety explanations as structured reason codes, with surface-specific presentation outside the package.

The first extraction candidates are target calculation, local-day calculation, streak and freeze behavior, XP/points eligibility, quest generation, and notification eligibility. Existing public behavior must be captured before files move.

## Package and deployment consequence

Shared-package adoption requires a follow-up change that:

1. establishes root package resolution for `web/app`, `mobile`, and `packages/*`;
2. keeps lockfile ownership and reproducible installs explicit;
3. changes the Vercel build root or packages the shared dependencies within the deploy context;
4. updates CI path filters so a shared-package change runs both client suites; and
5. verifies preview and production builds before either client switches imports.

This ADR does not silently change the Vercel project configuration. Until that follow-up is complete, characterization work may land, but deployed code must not depend on an unreachable root package.

## Consequences

### Positive

- Safety boundaries have one executable implementation.
- Both clients can run one fixture suite.
- Backend validation and migration tooling can consume the same deterministic rules.
- UI and storage remain platform-appropriate.

### Costs and risks

- Package/deployment setup is a prerequisite to extraction.
- Characterization can reveal existing cross-client differences that require an explicit product decision.
- A large one-shot move would make behavioral regressions hard to isolate; extraction must be incremental.

## Rejected alternatives

- Make `web/app/src/lib` the shared library: rejected because it is inside a browser application and carries the wrong dependency boundary.
- Copy web rules into mobile: rejected because it preserves drift.
- Merge both UIs: rejected because shared product rules do not require shared rendering or navigation.
- Rewrite all clients while extracting rules: rejected because it combines behavioral change with architecture change.

## Verification

The decision is implemented when:

- each extracted rule has characterization fixtures captured before relocation;
- web and mobile import the same package entry point;
- both suites run for changes under `packages/**`;
- no shared package imports a UI, storage, or network module; and
- production web deployment succeeds from a clean checkout with the shared packages present.

