# Snack Attack — implementation status

Updated 2026-09-10. This describes the local implementation, not a deployed release.

## Completed in this pass

- Signup: thumb-friendly mobile submit dock, keyboard-aware placement, shared-layout active tab, validation-only shake, and short-password feedback that cannot indicate high strength.
- Theme fixes: selected onboarding answers and their nested labels explicitly use matching foreground/background colors; signup success and mismatch text have separate light/dark tokens.
- Onboarding: personalized daily-recipe receipt using `NeoCard` and `plateReveal`; goal, activity and logging-pace choices now affect Momo's face as well as the dialogue. Existing drafts and eight-step numbering remain compatible.
- Momo: named curious, proud, skeptical, celebrating, sleepy, dramatic, caught-snacking and confetti expressions. Roaming checks the full path, not just its destination; optional bubbles are hidden when they cannot fit without covering controls. New controls appearing during a walk trigger a safety recheck.
- Reduced motion: the saved Momo preference stops nested artwork animations and roaming, while keeping static expression changes available. Direct interaction takes priority over a delayed entrance.
- Shared Motion features now load in a separate chunk, including layout support. The live UI uses `tactilePress`, `snapSpring`, `stickerDrop`, `bubblePop`, `plateReveal` and validation-only `microShake`.

## Verification

- Web unit/component tests: 572 passed across 64 files.
- Shared product tests: 55 passed. Copy-policy checks: 3 passed.
- Web lint: passed with 12 existing warnings; not a warning-free result.
- TypeScript and local production build: passed. Stylesheets resolve without the missing-import overlay.
- Chromium regressions: 35 passed in the final 36-test batch. The remaining test had an obsolete assumption that all of Today's summary fits on the first screen; it now checks that scrolling brings the macros fully clear of navigation, and passed on a separate rerun. All 36 targeted scenarios are therefore verified across those runs. These use local test accounts, not real production accounts.
- Browser coverage: signup and all onboarding steps at 320/390/768/desktop widths; selected-answer hover contrast in both themes; keyboard focus and 200% text; age recovery; saved appearance and Momo preferences; static Momo reactions; signup/log/edit/delete/undo/Saved on phone, tablet and desktop; built `/app/` routing; controls kept clear of the mascot.
- Manually inspected browser screenshots: 320px dark signup, desktop light signup, and 390px dark daily recipe. Automated responsive checks are not a substitute for a physical-phone keyboard or screen-reader review.

## Bundle tradeoff

The current local build has a 657.49 kB main JavaScript chunk, an 84.13 kB deferred Motion-feature chunk, and 320.23 kB CSS (minified, before compression). Gzip sizes are 204.72 kB, 27.62 kB and 54.22 kB respectively. The main chunk is smaller than the audited 687.40 kB baseline, but total JavaScript is larger because shared-layout features were added. The existing large-chunk warning remains; this is not a completed performance sprint.

## Still remaining from the original brief

1. **Onboarding structure:** eight steps still include grouped fields. A true one-question-at-a-time flow needs explicit draft migration and back/edit behavior, not just a visual restyle.
2. **Editorial art direction:** oversized condensed typography, Momo bursting through the welcome headline, richer ingredient cutouts and the full asymmetric poster composition are not complete. The current rounded display font remains.
3. **Choreography:** auth uses `AnimatePresence` for validation; onboarding replaces the active form immediately to keep focus and submission safe. A full exit/enter sequence needs inert outgoing content and focused keyboard tests. `useAnimate`, `useInView` and shared-layout answer-card transitions are not implemented.
4. **Accessibility and devices:** perform real screen-reader and mobile-keyboard testing, plus iOS Safari/Android browser coverage. Browser tests cover Chromium viewport layouts, not native mobile apps.
5. **Release:** recheck offline/cloud-sync and the cloud build, finish performance work, then create a scoped commit, push and verify the deployed revision. No deployment or cloud-sync success is claimed by this local UI pass.

Unrelated files and the existing untracked design assets have been left untouched.
