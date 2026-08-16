# Component state matrix

- Status: Phase 0 acceptance baseline
- Last reviewed: 2026-08-17
- First implementation: web Home macro progress group and optional activity row

The matrix is a release checklist for the first refreshed domain components. It separates nutrition information from engagement rewards: macro and calorie states may change the numbers and bars, but never XP, mascot mood, warning color, or celebration behavior.

| Surface | State | Required presentation | Automated evidence |
|---|---|---|---|
| Macro group | Zero | Three named rows, zero values, intact targets, empty neutral tracks | Web role/progressbar browser assertions |
| Macro group | Partial | Protein, carbohydrate, and fat each retain a fixed semantic color and show current/target text | Web browser smoke and unit copy policy |
| Macro group | At target | Full bar and neutral quantity text; no success reward | Healthy-engagement unit policy |
| Macro group | Over target | Bar remains full and copy says the amount over; no red/danger state, penalty, or mascot change | Healthy-engagement and banned-copy tests |
| Macro group | Tracking paused | Nutrition numbers and macro group are hidden; pause explanation remains | Existing Home pause behavior; visual baseline still required |
| Activity row | Empty | One secondary row says “Add optional details”; it does not compete with “Log a meal” | Home browser smoke |
| Activity row | Logged | Same row summarizes logged activity; no XP event or celebration | Web and mobile engagement-policy tests |
| Primary action | Narrow viewport | Pinned above bottom navigation with safe-area clearance | Browser flow coverage |
| Primary action | Wide viewport | Remains within the 480px application shell | Browser geometry regression assertion |
| Motion | Reduced motion | Pulses, confetti, and nonessential transitions stop; state remains legible | Existing reduced-motion branches; dedicated browser emulation still required |
| Accessibility | Keyboard/screen reader | Named region, three named progressbars, visible focus, button/link semantics | Browser role assertions; manual assistive-tech pass still required |

## Visual-regression policy

Semantic and geometry regressions are enforced now because they remain stable across operating systems and font rasterizers. Pixel baselines should be added only after the refreshed component is approved on the supported browser/device matrix; the approved captures, viewport, font assets, tolerance, and reviewer must be recorded together. Unreviewed screenshots are not treated as product acceptance evidence.
