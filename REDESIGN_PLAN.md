# Redesign implementation plan

End-to-end, phased. Supersedes `UI_PLAN.md`, which planned an incremental
cleanup — that direction was rejected in favour of a full redesign. The
cleanup work is not lost; it is folded in as Phase 0, because a redesign laid
on top of a rotted stylesheet inherits the rot.

**Target:** the direction published as *Fud AI Redesign* — chunky physical
surfaces, Fredoka display type, and the day-as-a-path hero.

**Assumption to correct if wrong:** this plans for **Hero A (the path)**, the
one built out on the New direction page. If you pick B, C or D instead, only
Phase 3 changes — every other phase is hero-agnostic.

---

## 0. What this must not break

Non-negotiable, and each phase's exit test re-checks them:

- **The §2 safety rules.** Goal floors and their explanations, the age gate,
  over-budget as a neutral state, the mascot never reacting to numbers, the
  two-notification cap, no leaderboards, pause and support reachable.
- **The regression baseline as it stands today**: 32 unit test files, 6
  Playwright specs, `components/accessibility.test.ts`, a clean `tsc -b`, a
  clean `oxlint`, a clean `vite build`.
- **The cloud sync path.** `web/shared/appStateContract.ts` and the IndexedDB /
  Neon layer are untouched by this work. No phase below edits state, storage,
  or the API.
- **The palette.** Every colour in the new direction already exists in
  `:root`. Nothing here introduces a hue.

---

## 1. What the redesign actually costs

Measured, so the phases below are sized honestly rather than guessed.

| Thing | Finding | Consequence |
|---|---|---|
| Retiring Fraunces | **7** CSS rules use `var(--serif)`, **0** TSX references | Font swap is a token-level change, not a sweep. Cheap. |
| Adding Fredoka | Already a dependency of the Expo app; on web it is one Google Fonts family | One `<link>` change, one token |
| Meal-slot data for the path hero | `mealType` exists on every entry; `defaultMealType(hour)` already derives the current slot | **The path hero needs no data-model change.** Biggest risk retired. |
| Screens to restyle | **18** page components | The long tail, and the bulk of the effort |
| Stylesheet | 7,092 lines, one file, 3 dead component blocks, 3 duplicated sections | Must be split before restyling, or duplicates multiply |
| Signature button adoption | `PressableButton` in 3 files, 28 raw `className="btn"` | The chunky press has to reach all 28 to feel systemic |
| Home layout defect | Dock at y758–816 and FAB at y674 both overlap the macro card | Fixed by the Home rebuild, not separately |

---

## Phase 0 — Make the ground safe

*No visible change. This is the phase that stops the redesign from rotting.*

1. Delete dead CSS: `.arc-gauge*` (10 rules), `.calorie-hero*` (12), `.home-add-pill` (2) — all zero-usage.
2. Merge the duplicated sections: Badges (L5408 + L6422), XP bar (L3963 + L6140), StreakCard (L5757 + L6008).
3. Split `index.css` into `styles/` — `tokens.css`, `base.css`, `components/*.css`, `screens/*.css` — behind one entry import.
4. Replace the 54 raw hex values outside `:root` with role tokens.

**Exit:** build, `tsc`, lint and all tests green. Screenshots byte-identical.
No selector without a live component.

**Risk:** low. **Reversible:** entirely.

---

## Phase 1 — The new foundation

*Still almost no visible change — this lays the vocabulary down.*

5. **Type**: add Fredoka to the font link, add `--display: 'Fredoka'`, repoint
   the 7 `var(--serif)` rules, retire `--serif`.
6. **Depth tokens**: `--edge-width` (side), `--edge-depth` (bottom),
   `--edge-coral`, `--edge-neutral`, `--edge-danger` — the single rule that
   every surface carries a thicker bottom edge than its sides.
7. **Radii up**: the chunky direction runs 16 / 20 / 26px where the current set
   runs 12 / 16 / 20.
8. **Primitive components**, as real React components with the press physics
   built in: `Surface` (the chunky card), `PressableButton` extended to
   `primary | secondary | destructive | ghost`, `Counter` (the streak/XP/freeze
   chip), `PathNode`.

**Exit:** the component sheet from the canvas renders from real components, not
mockup markup. Contrast checked on every new surface. `accessibility.test.ts`
extended to cover the new primitives.

**Risk:** low–medium — the primitives are new code, not edits to existing screens.

---

## Phase 2 — Adoption

*This is where it starts to look like the mockup, everywhere at once.*

9. Replace all **28 raw buttons** with `PressableButton`. Onboarding's black CTA
   becomes the coral raised control.
10. Replace ad-hoc cards with `Surface`, killing the beige-in-white nesting on
    Progress.
11. One `.eyebrow` label treatment replaces the three current variants
    (`RECENT` / `CURRENT` / `MEAL NAME`).
12. Restyle the bottom nav to the light chunky treatment.
13. Restrain the accent: coral reserved for the action, progress, and the
    streak. The Log screen's four pastel icon tints collapse to one neutral list.

**Exit:** zero raw `className="btn"`; coral appears at most three times per
screen; every screen still passes its Playwright spec.

**Risk:** medium — touches all 18 screens. Mitigated by doing it component-class
by component-class rather than screen by screen.

---

## Phase 3 — The hero

*The centrepiece, and the only phase that changes if you pick a different hero.*

14. `MealPath` component — four slots from `MEAL_ORDER`, each `done | current |
    later`, derived from today's entries plus `defaultMealType(hour)`.
15. The path SVG with its completed-segment fill, sized responsively rather than
    at fixed 420px.
16. Mascot positioned at the current node, keeping the §2.5 rule that it reads
    logging behaviour only — the node it stands on is a slot, never a calorie
    judgement.
17. Rebuild Home around it: counter row, hero, macro chips, quest, docked
    action. **This is where the dock/FAB overlap is fixed** — they share one row.

**Exit:** Home's primary content fits one 900px viewport without scrolling;
the measured overlap is gone; the path is correct at 0, 1, 4 and 6+ entries and
when tracking is paused.

**Risk:** medium — the most new UI, but on data that already exists.

---

## Phase 4 — The long tail

*The 15 screens that are not Home.*

18. **Log flow** — search, recents, quick add row, the neutral "other ways" list.
19. **Progress** — consistency strip, flat rows, badges reduced to earned plus next.
20. **Onboarding** — 7 steps in the new language; the highest-stakes screen set,
    since the age gate and the clamp explanations live here.
21. **Journey, Settings, Support, Saved, Coach, Review/Edit, Photo/Text log,
    Login, Forgot/Reset password.**

**Exit:** no screen still rendering the old vocabulary; §2 copy rules re-grepped
(banned words, `--danger` only on delete); all 6 Playwright specs green.

**Risk:** medium — breadth, not depth. Onboarding deserves its own review pass.

---

## Phase 5 — Feel

*The layer that makes it read as physical rather than drawn.*

22. Press physics on every tappable surface — the face travels onto its edge.
23. Path node interactions: tap a slot to log into it directly.
24. Swipe-to-edit/delete on meal rows, replacing the small pencil/chevron targets.
25. Rolling numbers via the existing `useCountUp` on ring, macros and XP.
26. The celebration overlay rebuilt in the new language.
27. **Reduced-motion audit** — all 51 animations against the current 13 guards,
    to total coverage.

**Exit:** every interactive element has a pressed state; reduced motion complete;
log-to-Home still under the 20-second target on hardware.

**Risk:** low–medium, and the most reversible work in the plan.

---

## Phase 6 — Land it

28. Full-app screenshot pass against the canvas artboards.
29. Contrast and touch-target audit — 44px minimum, which several current
    controls miss.
30. Hardware pass: press feel, haptics, and the 20-second log target — none of
    which can be judged from a headless browser.
31. Decide the **Expo app's fate**: it already uses Fredoka, so it either
    converges on this vocabulary or is retired. Carrying two divergent designs
    is the expensive option.

---

## Sequencing

```
Phase 0 ─ safe ground        no visible change
Phase 1 ─ foundation         no visible change
Phase 2 ─ adoption           looks new everywhere
Phase 3 ─ hero               the centrepiece
Phase 4 ─ long tail          consistency
Phase 5 ─ feel               physicality
Phase 6 ─ land               hardware + decisions
```

0 and 1 are prerequisites for everything. **2 and 3 can run in parallel** —
different files. 4 depends on 2. 5 depends on 3 and 4.

If you want something visible early, reorder to 0 → 1 → 3 → 2 → 4: the hero
lands first and Home looks redesigned while the rest still looks old. It is a
worse end state to sit in, but a better demo.

---

## Open questions

1. **Which hero.** A is planned. B, C or D changes Phase 3 only.
2. **Does the Expo app follow?** Phase 6, but the answer changes how much of the
   new vocabulary is worth extracting into shared tokens.
3. **Onboarding's black CTA** — unified to coral in Phase 2 unless it was
   deliberate.
4. **Ship per phase, or hold behind a flag?** Phases 2–4 leave the app in a
   visibly mixed state; a flag avoids shipping half-restyled screens but costs
   dual maintenance.
5. **The Discover tab** currently routes to Saved meals. Fix the label, build
   the screen, or drop the tab?
