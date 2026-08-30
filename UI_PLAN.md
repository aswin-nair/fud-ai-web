# UI plan — closed

Status: **closed on 2026-08-30.** This was a clay-era proposal against `e9f8e22`.
It is not awaiting sign-off and it is not a backlog.

The live web look is the enamel kitchen on `main` (`2108907`, `0652e28`,
`7d3b853`, `8d67868`). Do not reopen this file to redesign that system.

---

## What the old plan asked for, and where it went

| Old item | Outcome |
|---|---|
| Dock / Coach FAB overlapping Home macros | Fixed by the enamel Home layout; Coach is a stack route, not a second FAB over macros |
| 7,000-line `index.css`, dead selectors, duplicated sections | Split into `web/app/src/styles/` (`tokens`, `base`, `enamel`, screens, components) |
| Raw hex and unused `PressableButton` | Tokens in `tokens.css` / `tokens.ts`; coral is `--on-track`, not a second black primary |
| Three label treatments, four Log pastels | Collapsed into enamel eyebrows and dumpling roles |
| Home as eight competing blocks | Today is Day Ring + calorie ring + macros + ticket extras |
| Badge wall leading Progress | Insights is descriptive; live quests/gems are off |
| Discover as a question | **Saved meals.** That is the tab. |

The four open questions from the proposal are closed with those rows. Onboarding
uses the enamel coral CTA, not a second black primary. Activity chips are not
on Today.

§2 safety rules were never in scope to change and still are not.

---

## What this file is not

This is not the Expo camera, notification delivery, or EAS lockfile work.
Those are mobile follow-ups, not a UI-plan reopen.

Apple Sign-In is decided in `mobile/RELEASE_CHECKLIST.md`, not here.
