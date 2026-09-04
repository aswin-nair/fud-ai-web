# UI/UX foundations and release-flow checks

## Scope

Keep Fud AI's colourful, tactile design while making shared controls predictable.
This pass covers browser release-flow QA and the shared visual foundation, not a
new product feature or a hosting migration.

## Shared style ownership

- `web/app/src/styles/tokens.css` owns page gutters, heading sizes, control sizes,
  radii, focus rings and disabled colours.
- `styles/components/buttons.css` owns all `PressableButton` appearances and
  pointer/keyboard states. Page styles can set the component's font/padding
  variables but should not add competing `.pressable-face` recipes.
- `styles/components/forms.css` owns standard fields and focus treatment.
  Meal nutrition controls retain their purpose-specific layouts.
- `src/index.css` imports component recipes after page styles, with accessibility
  overrides last. Every import is checked by a unit test.
- New controls should retain at least a 44-pixel hit area, visible keyboard focus,
  readable disabled text and reduced-motion support.

## Bugs addressed

- Populated favourites no longer throw `allowed.has is not a function` during
  state validation. Array indices are no longer passed into schema parameters.
- The calorie readout no longer paints over its own ring or rotates the arc twice.
- Page entrances animate content rather than the shell containing fixed navigation;
  entering content cannot create horizontal page overflow.
- Disabled button-links do not invoke their action. Buttons have keyboard press
  feedback and one focus ring. Navigation back to Today focuses its page heading.

## Browser coverage

- Signup, onboarding, first meal, manual log, edit, favourite, reload, delete,
  undo and Saved persistence at mobile, tablet and desktop sizes.
- Text estimate, portion scaling, review correction, cancellation, photo retry,
  explicit upload initiation, validation and review-draft reload recovery.
- Core page screenshots at 360, 768 and 1440 pixels; additional viewport checks
  in `tap-targets.spec.ts`; long meal names and 44-pixel controls.
- Keyboard buttons, disabled links, modal focus return, route-heading focus,
  reduced motion, enlarged text and Momo yielding while typing.
- Production-build routing under `/app/`.

AI checks intercept provider requests and use a dummy key. Accounts and meals are
isolated local fixtures. These checks do not certify live provider responses,
cloud sync, real-device keyboards or Safari/Firefox behaviour.

## Reproduce

From `web/app`, run the unit tests, lint and `build:local`, followed by:

```text
npm run test:e2e -- e2e/release-flow.spec.ts e2e/navigation.spec.ts e2e/meal-flow.spec.ts e2e/ui-consistency.spec.ts e2e/tap-targets.spec.ts e2e/production.spec.ts --workers=1
```

Layout checks wait for finite entrance animations before measuring controls; the
separate viewport-matrix check also catches overflow during page entry. Use a
single worker for screenshot QA and avoid source edits while the dev server is
serving the run. Restart Vite if an import was added before its new file existed:
its failed-resolution cache can otherwise keep reporting the missing file.

Publishing remains a separate step. This document does not claim deployment.

## Verification record — 4 September 2026

- Unit tests: 546 passed in 63 files.
- Lint: no errors; existing Fast Refresh and one test-children-prop warnings remain.
- Local and Neon-configured production builds: passed; the existing large-bundle
  warning remains. The cloud build configuration was checked, not deployed.
- Release journey: four checks passed (three viewport sizes and Momo preferences).
- Production routing: both smoke checks passed.
- Screenshot QA: 360, 768 and 1440-pixel checks passed. Screenshots were visually
  reviewed for Today, Describe, You and the meal editor across the viewport set.
- Meal analysis/recovery, navigation, touch targets, viewport overflow, keyboard
  focus, reduced motion, enlarged text and Momo typing behaviour passed in focused
  Chromium runs. The complete historical E2E suite was not run in this pass.
