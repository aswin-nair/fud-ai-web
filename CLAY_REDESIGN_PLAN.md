# Claymorphic redesign — end-to-end plan

**Direction:** claymorphism, maxed — soft inflated surfaces that look squeezable
— held at *bold but calm*. Maximal on depth, texture and character; restrained on
colour clash and visual noise.

Supersedes `REDESIGN_PLAN.md`, which planned the flat-chunky direction. The phase
skeleton survives; the design language inside it does not.

---

## 0. Constraints

- **The coral/cream palette stays.** Clay is expressed through depth and light,
  not new hues.
- **The §2 safety rules are untouchable.** Goal floors and their explanations,
  the age gate, over-budget as a neutral state, the mascot reacting only to
  logging, the two-notification cap, no leaderboards, pause and support in two
  taps. *Depth must never become an alarm signal* — a surface does not get
  louder because someone ate more.
- **Storage, sync and the domain package are out of scope.** No phase touches
  `lib/durableState.ts`, `/api/state`, or `@fud-ai/domain`.
- **Regression baseline:** 32 unit test files, 6 Playwright specs,
  `components/accessibility.test.ts`, clean `tsc -b`, `oxlint`, `vite build`.

---

## 1. Where the repo actually is

Re-measured today, and a lot of the groundwork I previously planned is **already
done**:

| | Status |
|---|---|
| `index.css` split by concern | **Done** — 20 lines, importing 19 files under `styles/` |
| Dead selectors (`arc-gauge`, `calorie-hero`, `home-add-pill`) | **Done** — zero references |
| Raw hex outside tokens | **Done** — 0 |
| `PressableButton` adoption | **Done** — 19 files, only 2 raw `className="btn"` left |
| `tokens.css` | Exists, 120 lines |
| Inline `style={{ }}` in TSX | **78 remain** |
| CSS volume | **7,501 lines** across 19 files — organised, not smaller |
| Largest files | `screens/home.css` 1,661 · `screens/log.css` 1,021 |

**Consequence:** clay lands on a sound foundation. Phase 0 shrinks from a big
cleanup to a short guardrail-and-budget exercise.

---

## 2. What "claymorphism, maxed" means concretely

Not a vibe — a recipe. Every clay surface is the same four ingredients:

```css
/* The clay recipe */
border-radius: var(--clay-radius);        /* 24–40px — inflation reads in the corner */
background:
  linear-gradient(160deg, var(--clay-lift), var(--clay-base));
box-shadow:
  inset 0  6px 10px var(--clay-inner-light),   /* light pooling on the top face  */
  inset 0 -8px 14px var(--clay-inner-dark),    /* volume rolling under the base  */
  0 16px 28px var(--clay-cast),                /* the soft cast shadow           */
  0  2px  4px var(--clay-contact);             /* the tight contact shadow       */
```

Four rules the whole system obeys:

1. **Every surface is inflated, never flat.** No hairline-bordered rectangles.
2. **One light source, top-left, always.** Inconsistent light is what makes soft
   UI look broken rather than soft.
3. **Depth encodes hierarchy, never status.** A primary action sits highest; a
   disabled control sits flush. Nothing gets deeper because a number got bigger.
4. **Press squishes.** Clay compresses — the cast shadow collapses and the inner
   shadows invert. That inversion is the whole illusion.

**Held calm:** shadow opacities stay low and warm (tinted from `--ink`, never
neutral grey or black), the palette does not gain a hue, and ornament never
competes with the number a person opened the app to read.

---

## Phase 0 — Guardrails and budgets

*Short. It exists so the later phases can be judged rather than argued about.*

1. Snapshot the baseline: full-app screenshots at 420×900, current Lighthouse
   paint metrics, and a bundle-size number.
2. **Contrast harness** — extend `components/accessibility.test.ts` to assert
   text-on-clay contrast ratios. Inset shadows darken the top of a surface;
   this is the single most likely accessibility regression.
3. **Paint budget** — measure current scroll FPS on Home with CPU throttling.
   Stacked large-radius blurred shadows are expensive; set the ceiling now,
   before there are two hundred of them.
4. Convert the remaining **2 raw buttons** and triage the **78 inline styles**
   into "becomes a token" versus "genuinely dynamic".

**Exit:** baseline numbers recorded; contrast and FPS assertions failing-by-
design against clay so later phases have a target. **Risk:** none.

---

## Phase 1 — The clay token layer

5. Extend `styles/tokens.css` with the elevation system:
   `--clay-base`, `--clay-lift`, `--clay-inner-light`, `--clay-inner-dark`,
   `--clay-cast`, `--clay-contact`, and a three-step scale
   `--clay-e1 | --clay-e2 | --clay-e3` (resting, raised, primary).
6. Radii up to clay proportions: `--clay-radius-sm 18px`, `-md 26px`,
   `-lg 34px`, `-xl 44px`. Inflation is read in the corner radius.
7. **Squish motion tokens**: `--squish-in 90ms`, `--squish-out 260ms` with a
   spring-ish `cubic-bezier` overshoot, added to `styles/motion.css` alongside
   the existing `press` / `fill` / `enter` / `stagger`.
8. A single `clay-surface` mixin/class in `styles/base.css` so the recipe lives
   in exactly one place — not copy-pasted into 19 files.

**Exit:** the recipe renders correctly on cream, on white, and on coral;
contrast harness green for body text on every elevation. **Risk:** low.

---

## Phase 2 — Clay primitives

*Real components, not CSS sprinkled on existing markup.*

9. **`ClaySurface`** — the base card. Props for elevation and whether it is
   pressable.
10. **`PressableButton` → clay.** Keep the API (it is adopted in 19 files
    already); replace the flat two-layer face/shadow with the squish. This is
    the highest-leverage single change in the plan: 19 files improve at once.
11. **`ClayChip`** — streak, XP, freeze counters.
12. **`ClayInput`** — inset clay (pressed *into* the surface rather than raised
    out of it), which is the natural claymorphic form for a field.
13. **`ClayNode`** — the meal-path node, if the path hero survives Phase 3.
14. **`ClaySheet`** — the bottom sheet, currently a flat overlay.

**Exit:** a component gallery renders every primitive at every state; each has a
pressed state; `accessibility.test.ts` extended to cover them. **Risk:** low —
new code plus one well-adopted component swapped behind a stable API.

---

## Phase 3 — The hero

*The centrepiece, and the piece most changed by going clay.*

15. Decide the hero form in clay. The four directions on the canvas were drawn
    flat; clay changes their relative merit:
    - **The path** gains the most — nodes become physical pucks you press.
    - **The big numeral** loses the most — a flooded coral panel fights the
      soft-light model.
    - **Character-led** becomes strong: an inflated mascot *is* clay.
16. Build the chosen hero on `defaultMealType(hour)` and today's entries — data
    that already exists, so no model change.
17. **Fix the measured layout defect here**: the dock (y 758–816) and FAB
    (y 674) currently overlap the macro card. They share one row after the
    rebuild.

**Exit:** hero correct at 0, 1, 4 and 6+ entries and while paused; overlap gone;
Home's primary content fits one 900px viewport. **Risk:** medium.

---

## Phase 4 — Home

18. Rebuild Home on the clay primitives: counter row, hero, macro group, quest,
    docked action, nav.
19. **Nav to clay** — currently a dark translucent pill; becomes an inflated
    tray with the active tab pressed *in*.
20. Retire `screens/home.css` (1,661 lines) down to what the primitives do not
    already cover. This file is where duplication will otherwise breed.

**Exit:** Home matches the approved artboard; `home.css` materially smaller;
scroll FPS inside the Phase 0 budget. **Risk:** medium.

---

## Phase 5 — The long tail

*The 17 screens that are not Home.*

21. **Log flow** (`log.css`, 1,021 lines) — search, recents, quick add, the
    "other ways" list. Second-biggest surface after Home.
22. **Progress** — consistency strip, stat rows, badges.
23. **Onboarding** — 7 steps. **Highest stakes in the plan**: the age gate and
    the clamp explanations live here, and both are §2 safety surfaces. Gets its
    own review pass.
24. **Journey, Settings, Support, Saved, Coach, Review/Edit, Photo/Text log,
    Login, Forgot/Reset.**

**Exit:** no screen still rendering flat vocabulary; §2 copy re-grepped (banned
words, `--danger` only on delete); all 6 Playwright specs green. **Risk:**
medium — breadth, not depth.

---

## Phase 6 — Feel

25. **Squish everywhere** — every pressable surface compresses and its inner
    shadows invert. This is what sells clay; a clay app that does not deform on
    touch reads as a screenshot.
26. **Path node press** → log directly into that slot.
27. **Swipe-to-edit/delete** on meal rows, replacing small pencil/chevron targets.
28. Rolling numbers via the existing `useCountUp` on hero, macros and XP.
29. **Celebration overlay** rebuilt in clay.
30. **Reduced-motion audit to total coverage.** Squish must degrade to an
    instant state change, not a jump.

**Exit:** every interactive element deforms; reduced motion complete;
log-to-Home still under the 20-second target. **Risk:** low–medium.

---

## Phase 7 — Hardening

*Clay's two failure modes, addressed deliberately rather than discovered in
production.*

31. **Paint performance.** Measure against the Phase 0 budget on throttled CPU.
    Mitigations if it misses: fewer simultaneous large shadows, `will-change`
    only on actively animating elements, flattening off-screen surfaces, and
    dropping the cast shadow on long scrolling lists where it is invisible anyway.
32. **Contrast.** Every text-on-clay pairing re-checked at every elevation —
    inset darkening is cumulative and the worst case is small muted text on a
    deep surface.
33. **Touch targets** — 44px minimum, which several current controls miss.
34. Reduced-motion, keyboard focus rings on inflated surfaces (a focus ring on a
    shadowed element is easy to lose), and screen-reader labels on the new nav.

**Exit:** FPS inside budget on throttled CPU; zero contrast failures; all
targets ≥44px.

---

## Phase 8 — Land

35. Full-app screenshot pass against the artboards.
36. Hardware pass: squish feel, haptics, and the 20-second log target — none of
    which a headless browser can judge.
37. **Decide the Expo app's fate.** It shares the design DNA and already uses
    Fredoka. It either converges on clay or is retired; carrying two divergent
    designs is the expensive option.

---

## Sequencing

```
0 guardrails ─┐
1 tokens ─────┤ prerequisites, invisible
2 primitives ─┘
3 hero ───────┐ parallelisable — different files
5 long tail ──┘   (5 depends on 2, not on 3)
4 home ─────── depends on 2 and 3
6 feel ─────── depends on 3 and 4
7 hardening ── continuous, gated here
8 land
```

Phases 0–2 are prerequisites for everything. **3 and 5 can run in parallel.**
If you want something visible early, 0 → 1 → 2 → 3 → 4 puts a finished clay Home
in front of you while the rest still looks flat — a worse state to sit in, a
better demo.

---

## Risks, ranked

1. **Paint cost.** Multiple large blurred shadows per surface, times many
   surfaces, times a scrolling list, on a cheap Android. The single most likely
   reason this direction has to be softened. Budgeted in Phase 0, gated in 7.
2. **Contrast.** Inset shadows darken exactly where text sits.
3. **Depth-as-status drift.** The temptation to make an over-budget card deeper
   or louder. §2.4 forbids it; the plan says so twice for that reason.
4. **`home.css` and `log.css`** are 2,682 lines between them. If the primitives
   do not actually absorb that, clay gets copy-pasted and the duplication
   problem returns in a new shape.

---

## Open questions

1. **Which hero in clay** — the path, or character-led? Clay changes the merits;
   I would rebuild both small before committing.
2. **Ship per phase, or hold behind a flag?** Phases 3–5 leave the app visibly
   half-clay.
3. **Does the Expo app follow?** Changes how much is worth extracting into
   shared tokens now rather than later.
4. **The Discover tab** still routes to Saved meals — fix the label, build the
   screen, or drop the tab.
