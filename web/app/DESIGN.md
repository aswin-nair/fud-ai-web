# Fud AI Web — Design System

Design reference for the Fud AI web tracker (`web/app`). The UI is **mobile-first** and follows the published redesign: cream paper, chunky physical surfaces (thicker bottom edge), Fredoka display type, and Hero A — the day as a breakfast → lunch → dinner → snack path.

Styles are split under [`src/styles/`](src/styles/) and imported from [`src/index.css`](src/index.css).

## Expo

The Expo `mobile/` app stays a private alpha. It does **not** extract shared tokens from this vocabulary until a later converge-or-retire decision. Web ships this language first; carrying two designs is out of scope.

## Landing checks

- Contrast: coral on cream, ink on paper, and `--ink-soft` over-budget copy stay on the existing wellness tokens. `--danger` is delete-only.
- Touch targets: path nodes, pressable faces, and nav items are at least 44px.
- Hardware feel: press travels onto the bottom edge; log-to-Home stays the existing short path (manual entry or a path-node tap into that slot).

---

## Principles

| Principle | Implementation |
|-----------|----------------|
| **Mobile shell** | Max width 480px, centered column, `100dvh` layouts |
| **Light & warm** | Cream page background, white cards, flat coral accent (no dark surfaces, no gradients as a crutch) |
| **Editorial accents** | Serif (Fraunces) headlines on Home, Discover, and welcome slides; geometric sans everywhere else |
| **Data-first home** | Segmented arc calorie gauge → in-content "Log a meal" pill → macros → meal list |
| **Native parity** | Week strip, elevated center nav action, pill bottom nav match mobile app patterns |
| **Touch-friendly** | 40px+ tap targets, sticky nav, safe-area padding |
| **Minimal chrome** | Circular icon buttons in the header corners; primary actions live in-content + bottom nav |

---

## Color palette

Defined as CSS custom properties on `:root` ([`src/index.css`](src/index.css)).

### Surfaces

| Token | Hex | Usage |
|-------|-----|--------|
| `--paper` | `#F6F1EA` | App background, shell (also `--bg` via `--paper-deep`, see below) |
| `--paper-deep` | `#EFE6D8` | Nested surfaces, inputs, chip backgrounds — aliased as `--bg` |
| `--paper-warm` | `#FFFFFF` | Cards, login panel — aliased as `--surface-2` |
| `--paper-card` | `#FFFFFF` | Food sections, dropdowns, progress cards — aliased as `--surface` |

`--surface`, `--surface-2`, `--border`, and `--bg` are aliases kept for gamification/activity components; prefer the `--paper-*` names in new code.

### Text

| Token | Hex | Usage |
|-------|-----|--------|
| `--ink` | `#1A1A1A` | Primary text, primary buttons |
| `--ink-soft` | `#7A7266` | Secondary labels, subtitles |
| `--ink-mute` (`--ink-muted`) | `#A69C8C` | Tertiary text, section headers, placeholders |

### Accent (coral)

| Token | Value | Usage |
|-------|-------|--------|
| `--coral` | `#FF7A50` | Primary buttons, links, FAB, active nav |
| `--coral-start` / `--coral-end` | `#FF7A50` (equal) | Kept as two tokens for call-site compatibility, but **intentionally equal** — the reskin uses a **flat** coral, not a gradient |
| `--coral-deep` | `#E8623A` | Hover/pressed states, delete/error accents |
| `--coral-soft` | `rgba(255, 122, 80, 0.12)` | Chip/badge secondary backgrounds (e.g. `.food-card-pct`) |
| `--gradient-calorie` | `linear-gradient(135deg, var(--coral-start), var(--coral-end))` | Kept for compatibility; renders flat since start/end match |

### Semantic

| Token | Value | Usage |
|-------|-------|--------|
| `--green-goal` | `#34C759` | Goal indicators (charts, weight goal line) |
| `--rule` | `rgba(26, 20, 14, 0.08)` | Default borders |
| `--rule-strong` | `rgba(26, 20, 14, 0.16)` | Dropdowns, elevated borders, arc-gauge track |
| `--skeleton-base` | `#E1D5C0` | Loading-placeholder base — deliberately darker than `--paper`/`--paper-deep` so shapes stay visible on both the page and white cards |
| `--skeleton-shine` | `rgba(255, 255, 255, 0.85)` | Shimmer sweep highlight |

### Shadows

| Token | Value | Usage |
|-------|-------|--------|
| `--shadow-card` | `0 4px 20px rgba(38, 28, 16, 0.08)` | Elevated white cards |
| `--shadow-sm` | `0 2px 10px rgba(38, 28, 16, 0.06)` | Subtle card elevation |
| `--shadow-pill` | `0 8px 24px rgba(255, 122, 80, 0.28)` | Coral CTA pills (e.g. `.home-add-pill`) |

### Glass & overlay

These stay intentionally **dark regardless of the light theme** — they're floating chrome or full-screen scrims, not page content, and need to read clearly over any photo/content beneath them:

- **Bottom nav:** `rgba(26, 23, 20, 0.94)` + `backdrop-filter: blur(20px)`
- **Modal / activity-sheet / level-up backdrops:** `rgba(0,0,0,0.55–0.72)` dim scrims
- **Welcome-slide scrim:** dark gradient over full-bleed photography for white-text legibility
- **Toasts:** dark tinted chips per type (`.toast-success` / `.toast-info` / `.toast-error`) — see [Feedback](#feedback)

---

## Typography

Loaded in [`index.html`](index.html):

| Role | Family | Weights | Usage |
|------|--------|---------|--------|
| **UI / body** | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | 400–800 | All interface copy, most page titles |
| **Editorial / display** | [Fraunces](https://fonts.google.com/specimen/Fraunces) | 500–700 (variable, `opsz` axis) | Welcome-slide headlines, Home "Dashboard" title, Discover title — the "editorial" accent moments |
| **Data / labels** | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | 400–500 | Settings section headers, food meta, goal stats |

Base: `16px`, `line-height: 1.5`, `-webkit-font-smoothing: antialiased`.

Use serif sparingly and intentionally — it marks the primary "identity" heading of a screen (Home, Discover, welcome slides), while secondary/utility screens (Settings, Log flows, Progress, Journey, Coach) keep bold sans titles.

### Type scale

| Class / element | Size | Weight | Notes |
|-----------------|------|--------|-------|
| `.calorie-hero-value` | `2.5rem`-ish (arc-gauge center) | 800 | Solid `--ink`, not gradient text |
| `.home-title` | `1.5rem` | 700 | `--serif`, Home header |
| `.discover-title` | `1.75rem` (`.page-title` size) | 700 | `--serif` |
| `.welcome-title` | `2.1rem` | 600 | `--serif`, white, on photo |
| `.page-title` | `1.75rem` | 700 | `-0.02em` tracking, sans |
| `.screen-title` | `1.5rem` | 700 | Inner screens |
| `.login-title` | `2rem` | 700 | Auth |
| `.food-section-title` | `1.15rem` | 600 | Meal groups |
| `.home-macro-current` | `clamp(1.1rem, 4.5vw, 1.75rem)` | 700 | Macro numbers |
| Body / buttons | `0.95rem` | 500–600 | Default |
| `.nav-item` label | `0.6rem` | 600 | Bottom nav |
| `.field label` | `0.8rem` | 600 | Uppercase labels |

---

## Layout

```
┌────────────────────────────── max 480px ──────────────────────────────┐
│  (calendar)      Dashboard / Discover      (bell)  ← circular header buttons │
│                    Good morning, Alex                                 │
│                                                                       │
│  ┌─ Streak card (tappable → /journey) ────────────────────────────┐  │
│  │  🔥 5-day streak — keep it going!                                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ Week strip (compact, 7 columns) ───────────────────────────────┐  │
│  │  ‹  S   M   T   W   T   F  (S)  ›   ← selected = solid coral circle │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│                  ╭──────────────╮                                     │
│                  │   ⚡ Today    │  ← ArcGauge: segmented dial,        │
│                  │  1,240 kcal  │     coral segments fill clockwise    │
│                  │ Goal 2,000   │                                     │
│                  ╰──────────────╯                                     │
│                                                                       │
│              [ +  Log a meal ]   ← full-width coral pill               │
│                                                                       │
│         🏃 🚶 💪 🚴 🧘  ← quick activity-log chip row (scrollable)      │
│                                                                       │
│         85/120g    210/250g    42/65g   ← MacroGrid (3-col)          │
│         Protein      Carbs       Fat                                  │
│                                                                       │
│  Breakfast                                                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ (🥣)  Oatmeal            62%  │  ← circular tile · % of goal   │
│  │       320 kcal · P 12g · C 54g · F 6g          [✎] ›          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  padding-bottom: nav height + safe area + FAB clearance                │
│                                                          (Coach FAB) ↗ │
├───────────────────────────────────────────────────────────────────────┤
│  ╭──────────────────────────────────────────────────────────────╮    │
│  │  Home   Progress    (◎ Log)    Discover   Settings ← glass pill│    │
│  ╰──────────────────────────────────────────────────────────────╯    │
└───────────────────────────────────────────────────────────────────────┘
```

Journey and Coach are no longer persistent nav tabs — Journey is reached via the tappable streak card on Home, Coach via the floating chat FAB (bottom-right, above the nav).

### Spacing tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--nav-h` | `92px` | Bottom nav clearance |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | iOS home indicator |
| `--radius` | `16px` | Cards, modals |
| `--radius-sm` | `12px` | Buttons, inputs, emoji tiles |
| Page padding | `16px` | `.app-main` horizontal |
| Card padding | `16px` | Default `.card` |
| Home main bottom padding | `calc(var(--nav-h) + var(--safe-bottom) + 86px)` | Extra clearance so the Coach FAB never overlaps the last food card's edit button |

### Shell classes

- `.app-shell` — column flex, max-width 480px, min-height 100dvh
- `.app-main` — scrollable content with bottom padding for nav
- `.home-shell` / `.coach-shell` / `.progress-main` — screen-specific tweaks
- `ScrollToTop` ([`src/App.tsx`](src/App.tsx)) — resets `window.scrollTo(0,0)` on every route change so a new screen never inherits the previous page's scroll offset

---

## Components

### ArcGauge + CalorieHero

Segmented radial dial replacing the old continuous SVG ring.

- `ArcGauge` ([`src/components/ArcGauge.tsx`](src/components/ArcGauge.tsx)) is a generic, reusable primitive: takes `progress` (0–1), `segments` (default 12), `arcDegrees` (default 218°), `filledColor`/`trackColor`, and renders short rounded-cap `<path>` strokes swept around an arc centered on the bottom, opening through the top. Anything can be passed as `children` to render centered inside the arc.
- `CalorieHero` ([`src/components/CalorieHero.tsx`](src/components/CalorieHero.tsx)) composes `ArcGauge` with: a small bolt icon + day label above the number, the kcal count (`useCountUp`), and a `Goal X kcal` line beneath (or `X kcal over` in coral-deep when over budget). Zone-based motivation logic (`lib/motivation.ts`) still drives the filled segment color (`--coral` / `--green-goal` / `--coral-deep`).
- Track segments use `--rule-strong`; filled segments use the zone color.

### WeekStrip

Compact seven-day horizontal picker aligned to the week containing the selected date, with prev/next week nav arrows.

| State | Visual |
|-------|--------|
| Default | Muted weekday label + plain date circle |
| **Today** (unselected) | Coral border ring on circle |
| **Selected** | Solid coral fill, white text |
| **Future** | Disabled |

Uses local calendar dates (`localDayKey`) — not UTC — for day matching.

File: [`src/components/WeekStrip.tsx`](src/components/WeekStrip.tsx)

### DatePickerModal

Bottom-sheet month calendar opened from the Home header's calendar button — lets users jump further back than the week strip without losing the fast day-flip pattern.

- Month navigation (prev/next, disabled past account creation / future)
- `monthGridWeeks` / `startOfMonth` helpers in [`src/lib/dates.ts`](src/lib/dates.ts)
- "Jump to today" shortcut pill
- Selected day highlighted with solid coral circle

File: [`src/components/DatePickerModal.tsx`](src/components/DatePickerModal.tsx)

### MacroGrid

Three-column grid: Protein, Carbs, Fat.

Each card: colored pill with current grams → thin progress bar → label → `Xg left`. Colors are per-macro constants (blue/orange/pink), independent of the coral theme so the three stay visually distinct.

File: [`src/components/MacroGrid.tsx`](src/components/MacroGrid.tsx)

### StreakCard (Home summary + Journey entry point)

Doubles as the Journey feature's entry point — the whole card is a `Link` to `/journey` (previously a static div). Three visual states:

| State | Visual |
|-------|--------|
| Zero streak | Neutral `.streak-card-zero` — faint tint, "Start your streak today!" |
| Active streak | Warm amber tint, flame emoji (intensity scales via `.flame-tier-1..4`), day count |
| At risk (streak > 0, not logged today) | `.at-risk` — stronger amber + `at-risk-pulse` animation, "keep it going" framing |

File: [`src/components/StreakCard.tsx`](src/components/StreakCard.tsx)

### FoodList

Meals grouped by type (Breakfast, Lunch, Dinner, Snack), collapsible per section. Each row:

- 48×48 **circular** emoji tile (`.food-card-emoji`, `border-radius: 50%` — previously a rounded square)
- Name + coral **`% of goal`** badge (`.food-card-pct`, `round(entry.calories / dailyGoal * 100)`)
- `{calories} kcal · P · C · F` meta row
- Circular **edit** affordance (`.food-card-edit-btn`, `IconEdit`) that jumps straight to `/edit/:id`
- Tap the row body to expand an inline quick-edit panel (calorie override, macro chips, ingredient breakdown); swipe left to reveal delete

File: [`src/components/FoodList.tsx`](src/components/FoodList.tsx)

### BottomNav (5-slot glass pill + Log action)

Fixed floating dark glass pill — 5 slots, center one elevated:

| Slot | Route / action | Icon |
|------|-----------------|------|
| Home | `/` | House |
| Progress | `/progress` | Bar chart |
| **Log** (elevated, center) | opens dropdown (not a route) | Scan/camera-in-square |
| Discover | `/discover` | Star |
| Settings | `/settings` | Gear |

The center Log button toggles a dropdown (`.nav-log-dropdown`, `role="menu"`) with four options, replacing the old floating top-right add button:

| Item | Route |
|------|-------|
| Text Entry | `/log/text` |
| Photo | `/log/photo` |
| Saved Meals | `/log/saved` |
| Manual Entry | `/log/manual` |

Journey and Coach were removed from the persistent nav — see [Layout](#layout) for their new entry points (Home streak card / Coach FAB).

Active tab: `--coral-start` icon/label color + `rgba(255,255,255,0.1)` pill background (against the dark nav).

File: [`src/components/BottomNav.tsx`](src/components/BottomNav.tsx)

### Coach FAB

Floating circular action button (`.fab`, 56×56, solid coral, bottom-right, above the nav) linking to `/coach`. Replaces Coach's old persistent nav tab; the full Coach page and its functionality are unchanged.

### Welcome slides (leading onboarding steps)

Full-bleed photography carousel shown before the existing profile-setup form, as the first 1–3 steps of `OnboardingPage`'s step state machine (same `!state.onboarded` gating, no new routes/flags).

- `.welcome-shell` — `100dvh`, dark fallback background (`#1a1410`) behind the photo
- `.welcome-photo` — full-bleed `<img>`, slow scale-in entrance; `key={welcomeIndex}` forces remount so the entrance animation replays per slide
- `.welcome-scrim` — bottom-weighted dark gradient for white-text legibility over photography
- `.welcome-title` (serif, white) + `.welcome-sub` + pagination dots (`.welcome-dot.active`) + coral "Continue" pill
- `.welcome-skip` — glass pill, top-right, skips straight to the profile form

Images: `web/assets/welcome-1.webp` / `welcome-2.webp` / `welcome-3.webp` (compressed WebP, ~750px wide, ~150–200KB each).

File: [`src/pages/OnboardingPage.tsx`](src/pages/OnboardingPage.tsx)

### Discover (restyled Saved Meals)

`SavedMealsPage.tsx` now renders as a "Discover" browsing screen, backed entirely by real data — no fabricated recipe content. Reachable both as a nav tab (`/discover`) and as a Log-menu sub-route (`/log/saved`, which shows a `BackLink` since it's reached mid-flow rather than as a tab).

- Serif `.discover-title` ("Discover") + subtitle
- `.discover-search` — live client-side filter over `state.favoriteMeals` by name
- `.discover-chip-row` — meal-type filter chips (All/Breakfast/Lunch/Dinner/Snack/Other) on the real `mealType` field
- `.discover-grid` — 2-column `.discover-card` grid for favorites: circular emoji tile, name, kcal, a macro-ratio bar (protein/carbs/fat proportion standing in for a "difficulty bar"), serving stepper, and a coral **Log** button
- `Recents` section below keeps the original `MealRow` list layout for quick re-logging of recent (non-favorited) entries

File: [`src/pages/SavedMealsPage.tsx`](src/pages/SavedMealsPage.tsx)

### Buttons

| Class | Style |
|-------|--------|
| `.btn-primary` | Solid `--ink` (near-black), white text — primary CTA on light surfaces |
| `.btn-log` | Solid coral — the specific "commit a food log" action (Log meal / Save changes) |
| `.btn-secondary` | Coral soft fill + coral text |
| `.btn-ghost` | Transparent + rule border |
| `.btn-block` | Full width |
| `.home-add-pill` | Full-width solid coral pill with `+` icon, `--shadow-pill` — Home's in-content "Log a meal" CTA |
| `.chip` / `.chip.active` | Pill selectors (onboarding, settings) |
| `.range-chip` | Progress time-range pills |
| `.discover-chip` / `.discover-chip.active` | Discover filter chips (active = solid `--ink`) |

Press feedback: `transform: scale(0.98)` on `:active` (also via the shared `.press-spring` class).

### Forms

- `.field` — stacked label + input
- Labels: uppercase, `--ink-soft`, `0.8rem`
- Inputs: `--paper-deep` background, focus border `--coral`

### Cards & surfaces

- `.card` — white surface + rule border + 16px radius + `--shadow-sm`
- `.food-section-card` — meal list container
- `.progress-card` — Progress tab charts/stats
- `.login-card` — centered auth panel (max 400px)
- `.discover-card` — Discover grid item

### Chat (Coach)

- **User bubble:** flat coral background, white text, bottom-right sharp corner
- **Assistant bubble:** `--paper-deep` + `--rule` border, `--ink` text, bottom-left sharp corner
- **Input row:** fixed above bottom nav

### Charts (Progress)

- `.progress-line-chart` — weight over time (smoothed path, coral line + soft area fill, green dashed goal line)
- `.progress-bar-chart` — daily calories with goal line, coral gradient bars (deeper coral when over goal)
- Grid lines use `rgba(26,20,14,0.08)` (light-theme value — **not** the old `rgba(255,255,255,...)`, which would be invisible on a light background)
- Range chips: `1W`, `1M`, `3M`, `6M`, `1Y`, `All`

File: [`src/components/Charts.tsx`](src/components/Charts.tsx)

### Modals

- `.modal-backdrop` — full-screen dark dim overlay (intentionally dark regardless of theme)
- `.modal-sheet` — bottom sheet or centered white panel for weight log, date picker, etc.
- `.activity-sheet-backdrop` / `.activity-sheet` — quick activity-log bottom sheet from Home's activity chip row

### Feedback

- `.error-banner` — coral-tinted alert
- `.loading-spinner` — coral-top ring animation
- `.empty-state` — centered muted message
- `.toast-success` / `.toast-info` / `.toast-error` — dark tinted chips (deliberately dark, like the bottom nav) with a bright semantic text color, so they read as floating notifications on top of any screen

### Skeletons

`Skeleton` / `HomeSkeleton` ([`src/components/Skeleton.tsx`](src/components/Skeleton.tsx), [`src/components/HomeSkeleton.tsx`](src/components/HomeSkeleton.tsx)) render a shimmering placeholder for ~420ms on Home's first mount.

The shimmer gradient uses dedicated `--skeleton-base` / `--skeleton-shine` tokens rather than reusing `--paper-deep` — the page background and `--paper-deep` are nearly the same warm cream, so a skeleton built from `--paper-deep` alone would be almost invisible against the page. `--skeleton-base` (`#E1D5C0`) is deliberately a shade darker than both `--paper` and white cards so placeholder shapes stay legible wherever they sit.

---

## Screens

| Screen | Route | Layout notes |
|--------|-------|--------------|
| Login | `/login` | Centered white card, logo, Google + email tabs |
| Onboarding — welcome slides | `/onboarding` (leading steps) | Full-bleed photo carousel, serif headline, pagination dots, skip |
| Onboarding — profile form | `/onboarding` (later steps) | Multi-step dots, chip selectors, BMR/TDEE |
| **Home** | `/` | Header (calendar/bell) → streak card → week strip → arc gauge → Log pill → activity chips → macros → food list; Coach FAB floats bottom-right |
| Progress | `/progress` | Range chips, weight stats, calorie chart, achievements grid |
| Journey | `/journey` | Reached via Home's streak card; stage path, XP bar, streak/freezes, badge grid |
| Coach | `/coach` | Reached via FAB; chat thread + fixed input |
| Log menu | `/log` | Full-page log options (AI-powered + manual) |
| Text / Photo / Manual | `/log/*` | Form + analyze flow |
| Review food | `/review` | Serving stepper, calorie hero, macro grid, ingredient breakdown, editable AI result |
| Edit food | `/edit/:id` | Same `.review-*` layout minus servings/ingredients, + favorite toggle, save/delete |
| **Discover** | `/discover` (tab) or `/log/saved` (sub-route, shows back link) | Search + meal-type chips + favorites grid + recents list |
| Settings | `/settings` | Mono section headers, export/import |
| About | `/about` | App info |

Route map: [`src/App.tsx`](src/App.tsx)

Production base path: `/app/` (Vite `base` in production). Dev uses `/`.

---

## Motion

| Element | Transition |
|---------|------------|
| Buttons | `opacity 0.15s`, `transform 0.15s` |
| Progress bars | `width 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)` |
| Nav / week circles | `background 0.2s`, `color 0.2s` |
| Home sections on mount | `.home-section-enter` / `.home-hero-enter` — staggered fade+rise via `--enter-delay`, `both` fill mode |
| Welcome-slide photo | Slow `scale(1.08 → 1)` over 8s per slide |
| Skeleton shimmer | `background-position` sweep, 1.6s ease-in-out infinite |
| Spinner | `spin 0.7s linear infinite` |

Keep animations subtle — data updates should feel smooth, not flashy. All `.home-section-enter`/`.streak-fire`/shimmer-adjacent animations respect `prefers-reduced-motion: reduce`.

---

## Icons

Custom outlined-stroke SVG set, `stroke="currentColor"`, in [`src/components/icons.tsx`](src/components/icons.tsx):

- **Nav / actions:** Home, Progress, Journey (unused in nav, kept for Journey-page use), Coach, Settings, Star (Discover), Scan (center Log action), Plus, Close, chevrons
- **Header:** Calendar (date-picker trigger), Bell (with optional coral notification dot — `IconBell({ dot })`)
- **Log flow:** Edit, Camera, Clipboard, Search
- **Food rows:** emoji from AI analysis (fallback 🍽️)
- **Log menu dropdown:** icon-tile chips (coral/blue/gold/teal accent backgrounds) rather than plain emoji prefixes
- **App logo:** `web/assets/calorie logo transparent.png`

No external icon font library.

---

## Accessibility

- Semantic landmarks: `<main>`, `<nav aria-label="Main">`
- Log dropdown: `aria-label="Log food"`, `aria-expanded`, `aria-haspopup="menu"`, `role="menu"` / `role="menuitem"`
- Disabled future dates on week strip and date-picker modal
- Focus rings via input `border-color` on focus
- Distinct accessible names for buttons that share visual intent but differ in scope — e.g. the nav's "Log food" button vs. Home's in-content "Log a meal" pill are two different accessible names so assistive tech (and Playwright) can disambiguate them
- Color contrast: primary text (`--ink` on `--paper`/white) comfortably meets WCAG for body copy; muted text (`--ink-soft`, `--ink-mute`) used only for secondary/tertiary info

---

## Brand assets

| Asset | Path |
|-------|------|
| Logo | `web/assets/calorie logo transparent.png` |
| Welcome-slide photography | `web/assets/welcome-1.webp`, `welcome-2.webp`, `welcome-3.webp` |
| Theme color (meta) | `#F6F1EA` |
| Favicon | Same logo via Vite `@assets` alias |

---

## Extending the design

When adding new UI:

1. **Reuse tokens** — add new colors to `:root`, not hard-coded hex in components
2. **Match card pattern** — `--paper-card` (white) + `--rule` border + `--radius` + `--shadow-sm`/`--shadow-card`
3. **Respect nav inset** — pad bottom content with `calc(var(--nav-h) + var(--safe-bottom) + 16px)` (Home needs extra clearance for the Coach FAB — see [Layout](#layout))
4. **Keep the 480px shell** — full-bleed elements (e.g. welcome slides) still center via `.app-shell`/`.welcome-shell`
5. **Prefer Plus Jakarta Sans** — reserve Fraunces for a screen's one primary editorial heading, and JetBrains Mono for numeric/meta labels
6. **Coral = action, and it's flat** — primary CTA, progress, selected states; don't reintroduce a coral *gradient* or a second competing accent color
7. **Dark chrome stays dark on purpose** — bottom nav, toasts, modal/sheet backdrops, and the welcome-slide scrim are deliberately dark overlays over a light app; don't "fix" them to match `--paper` — check the [Glass & overlay](#glass--overlay) section before changing one
8. **New loading placeholders** — use the shared `Skeleton` component (`--skeleton-base`/`--skeleton-shine`), not ad-hoc grays, so shimmer contrast stays correct against both the cream page and white cards

---

## Related docs

- [README.md](./README.md) — setup & features
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel & env vars
- Native app reference: [fud-ai](https://github.com/apoorvdarshan/fud-ai) iOS/Android UI
