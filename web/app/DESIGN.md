# Fud AI Web — Design System

Design reference for the Fud AI web tracker (`web/app`). The UI is **mobile-first**, **dark-themed**, and aligned with the native iOS/Android app: calorie hero, week strip, macro cards, grouped food log, and floating bottom navigation.

All styles live in a single token file: [`src/index.css`](src/index.css).

---

## Principles

| Principle | Implementation |
|-----------|----------------|
| **Mobile shell** | Max width 480px, centered column, `100dvh` layouts |
| **Dark & warm** | Near-black surfaces with coral accent gradients |
| **Data-first home** | Large calorie number → progress bar → macros → meal list |
| **Native parity** | Week strip, glass add button, pill bottom nav match mobile patterns |
| **Touch-friendly** | 40px+ tap targets, sticky nav, safe-area padding |
| **Minimal chrome** | No top app bar on Home; actions live in header corner + bottom nav |

---

## Color palette

Defined as CSS custom properties on `:root`.

### Surfaces

| Token | Hex | Usage |
|-------|-----|--------|
| `--paper` | `#0C0C0C` | App background, shell |
| `--paper-deep` | `#141414` | Inputs, nested surfaces |
| `--paper-warm` | `#1C1C1E` | Cards, login panel |
| `--paper-card` | `#1C1C1E` | Food sections, dropdowns, progress cards |

### Text

| Token | Hex | Usage |
|-------|-----|--------|
| `--ink` | `#F2F2F7` | Primary text |
| `--ink-soft` | `#8E8E93` | Secondary labels, subtitles |
| `--ink-mute` | `#636366` | Tertiary, section headers (mono) |

### Accent (coral)

| Token | Value | Usage |
|-------|-------|--------|
| `--coral` | `#FF6B8A` | Primary buttons, user chat bubbles |
| `--coral-start` | `#FF375F` | Gradient start, macro values, active nav |
| `--coral-end` | `#FF6B8A` | Gradient end |
| `--coral-deep` | `#E63946` | Button hover, error tones |
| `--coral-soft` | `rgba(255, 55, 95, 0.14)` | Chip/button secondary backgrounds |
| `--gradient-calorie` | `linear-gradient(135deg, #FF375F, #FF6B8A)` | Calorie hero number, progress fills, selected day |

### Semantic

| Token | Hex | Usage |
|-------|-----|--------|
| `--green-goal` | `#34C759` | Goal indicators (charts) |
| `--rule` | `rgba(255,255,255,0.08)` | Default borders |
| `--rule-strong` | `rgba(255,255,255,0.14)` | Dropdowns, elevated borders |

### Glass & overlay

- **Bottom nav:** `rgba(21, 21, 26, 0.88)` + `backdrop-filter: blur(20px)`
- **Add menu button:** white gradient border, `0.7px` hairline, soft shadow
- **Modal backdrop:** semi-transparent overlay (see `.modal-backdrop`)

---

## Typography

Loaded in [`index.html`](index.html):

| Role | Family | Weights | Usage |
|------|--------|---------|--------|
| **UI / body** | [Manrope](https://fonts.google.com/specimen/Manrope) | 400–700 | All interface copy |
| **Data / labels** | [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | 400–500 | Settings section headers, food meta, goal stats |
| **Display** | [Fraunces](https://fonts.google.com/specimen/Fraunces) | 500–700 | Available in HTML; reserved for marketing/display if needed |

Base: `16px`, `line-height: 1.5`, `-webkit-font-smoothing: antialiased`.

### Type scale

| Class / element | Size | Weight | Notes |
|-----------------|------|--------|-------|
| `.calorie-hero-value` | `clamp(3rem, 14vw, 4.5rem)` | 700 | Gradient text |
| `.page-title` | `1.75rem` | 700 | `-0.02em` tracking |
| `.screen-title` | `1.5rem` | 700 | Inner screens |
| `.login-title` | `2rem` | 700 | Auth |
| `.food-section-title` | `1.15rem` | 600 | Meal groups |
| `.home-macro-current` | `clamp(1.1rem, 4.5vw, 1.75rem)` | 700 | Macro numbers |
| Body / buttons | `0.95rem` | 500–600 | Default |
| `.nav-item` label | `0.62rem` | 600 | Bottom nav |
| `.field label` | `0.8rem` | 600 | Uppercase labels |

---

## Layout

```
┌────────────────────────────── max 480px ──────────────────────────────┐
│  [optional header — e.g. + button top-right]                          │
│                                                                       │
│  ┌─ Week strip (7 columns) ─────────────────────────────────────┐  │
│  │  M   T   W   T   F   S   S                                      │  │
│  │ (●) 28  29  30  31   1   2   ← selected = coral gradient circle│  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│                    1,240  ← CalorieHero (gradient)                    │
│                   of 2,000 kcal                                       │
│              ═══════════●──────── progress bar                        │
│                    760 left                                           │
│                                                                       │
│         85/120g    210/250g    42/65g   ← MacroGrid (3-col)          │
│         Protein      Carbs       Fat                                  │
│              View More ›                                              │
│                                                                       │
│  Breakfast                                                            │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ 🥣  Oatmeal · 320 kcal · P 12g · C 54g · F 6g                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  padding-bottom: nav height + safe area                               │
├───────────────────────────────────────────────────────────────────────┤
│  ╭──────────────────────────────────────────────────────────────╮    │
│  │  Home   Progress   Coach   Settings   About    ← glass pill  │    │
│  ╰──────────────────────────────────────────────────────────────╯    │
└───────────────────────────────────────────────────────────────────────┘
```

### Spacing tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--nav-h` | `92px` | Bottom nav clearance |
| `--safe-bottom` | `env(safe-area-inset-bottom)` | iOS home indicator |
| `--radius` | `16px` | Cards, modals |
| `--radius-sm` | `12px` | Buttons, inputs, emoji tiles |
| Page padding | `16px` | `.app-main` horizontal |
| Card padding | `16px` | Default `.card` |

### Shell classes

- `.app-shell` — column flex, max-width 480px, min-height 100dvh
- `.app-main` — scrollable content with bottom padding for nav
- `.home-shell` / `.coach-shell` / `.progress-main` — screen-specific tweaks

---

## Components

### CalorieHero

Large centered calorie display for the Home dashboard.

- **Number:** coral gradient, clipped text
- **Goal line:** muted gray `of X kcal`
- **Bar:** 10px capsule; track `rgba(255,55,95,0.12)`; fill uses gradient + glow
- **Zero state:** glowing dot instead of fill
- **Footer:** `{remaining} left` in `--ink-soft`

File: [`src/components/CalorieHero.tsx`](src/components/CalorieHero.tsx)

### WeekStrip

Seven-day horizontal picker aligned to the week containing the selected date.

| State | Visual |
|-------|--------|
| Default | Gray weekday label + plain date circle |
| **Today** (unselected) | Coral border ring on circle |
| **Selected** | Coral gradient fill, white text, shadow |
| **Future** | Disabled, 35% opacity |

Uses local calendar dates (`localDayKey`) — not UTC — for day matching.

File: [`src/components/WeekStrip.tsx`](src/components/WeekStrip.tsx)

### MacroGrid

Three-column grid: Protein, Carbs, Fat.

Each card: `current/goal` → 6px progress bar → label → `Xg left`.

File: [`src/components/MacroGrid.tsx`](src/components/MacroGrid.tsx)

### FoodList

Meals grouped by type (Breakfast, Lunch, Dinner, Snack). Each row:

- 48×48 emoji tile (`border-radius: 12px`)
- Name + `{calories} kcal · P · C · F` meta
- Coral calorie highlight
- Tappable → edit screen

File: [`src/components/FoodList.tsx`](src/components/FoodList.tsx)

### AddMenuButton

Glass **+** button (40×40) top-right on Home. Dropdown menu:

| Item | Route |
|------|-------|
| Text Entry | `/log/text` |
| Photo | `/log/photo` |
| Saved Meals | `/log/saved` |
| Manual Entry | `/log/manual` |

File: [`src/components/AddMenuButton.tsx`](src/components/AddMenuButton.tsx)

### BottomNav

Fixed floating pill nav — 5 tabs with inline SVG icons (20×20).

| Tab | Route | Icon |
|-----|-------|------|
| Home | `/` | House |
| Progress | `/progress` | Bar chart |
| Coach | `/coach` | Chat bubble |
| Settings | `/settings` | Gear |
| About | `/about` | Info circle |

Active tab: `--coral-start` color + `rgba(255,255,255,0.1)` pill background.

File: [`src/components/BottomNav.tsx`](src/components/BottomNav.tsx)

### Buttons

| Class | Style |
|-------|--------|
| `.btn-primary` | Solid coral, dark text |
| `.btn-secondary` | Coral soft fill + coral text |
| `.btn-ghost` | Transparent + rule border |
| `.btn-block` | Full width |
| `.chip` / `.chip.active` | Pill selectors (onboarding, settings) |
| `.range-chip` | Progress time-range pills |

Press feedback: `transform: scale(0.98)` on `:active`.

### Forms

- `.field` — stacked label + input
- Labels: uppercase, `--ink-soft`, `0.8rem`
- Inputs: `--paper-deep` background, focus border `--coral`

### Cards & surfaces

- `.card` — warm surface + rule border + 16px radius
- `.food-section-card` — meal list container
- `.progress-card` — Progress tab charts/stats
- `.login-card` — centered auth panel (max 400px)

### Chat (Coach)

- **User bubble:** coral background, bottom-right sharp corner
- **Assistant bubble:** `--paper-warm` + border, bottom-left sharp corner
- **Input row:** fixed above bottom nav, blurred dark bar

### Charts (Progress)

- `.progress-line-chart` — weight over time
- `.progress-bar-chart` — daily calories with goal line
- Range chips: `1W`, `1M`, `3M`, `6M`, `1Y`, `All`

File: [`src/components/Charts.tsx`](src/components/Charts.tsx)

### Modals

- `.modal-backdrop` — full-screen dim overlay
- `.modal-sheet` — bottom sheet or centered panel for weight log, etc.

### Feedback

- `.error-banner` — red-tinted alert
- `.loading-spinner` — coral-top ring animation
- `.empty-state` — centered muted message

---

## Screens

| Screen | Route | Layout notes |
|--------|-------|--------------|
| Login | `/login` | Centered card, logo, Google + email tabs |
| Onboarding | `/onboarding` | Multi-step dots, chip selectors, BMR/TDEE |
| **Home** | `/` | Week strip → hero → macros → food list |
| Progress | `/progress` | Range chips, weight stats, calorie chart |
| Coach | `/coach` | Chat thread + fixed input |
| Log menu | `/log` | Full-page log options |
| Text / Photo / Manual | `/log/*` | Form + analyze flow |
| Review food | `/review` | 2×2 stat grid, editable AI result |
| Edit food | `/edit/:id` | Same grid, save/delete |
| Saved meals | `/log/saved` | Star favorites + quick re-log |
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
| Spinner | `spin 0.7s linear infinite` |

Keep animations subtle — data updates should feel smooth, not flashy.

---

## Icons

- **Bottom nav:** inline SVG, `stroke="currentColor"`, `strokeWidth="2"`
- **Add menu:** plus SVG in glass button
- **Food rows:** emoji from AI analysis (fallback 🍽️)
- **Log menu dropdown:** unicode emoji prefixes (✏️ 📷 ⭐ 📝)
- **App logo:** `web/assets/calorie logo transparent.png`

No external icon font library.

---

## Accessibility

- Semantic landmarks: `<main>`, `<nav aria-label="Main">`
- Add menu: `aria-label="Log food"`, `aria-expanded`, `role="menu"`
- Disabled future dates on week strip (`disabled` attribute)
- Focus rings via input `border-color` on focus
- Color contrast: primary text on `--paper` meets WCAG for body copy; muted text used only for secondary info

---

## Brand assets

| Asset | Path |
|-------|------|
| Logo | `web/assets/calorie logo transparent.png` |
| Theme color (meta) | `#0C0C0C` |
| Favicon | Same logo via Vite `@assets` alias |

---

## Extending the design

When adding new UI:

1. **Reuse tokens** — add new colors to `:root`, not hard-coded hex in components
2. **Match card pattern** — `--paper-card` + `--rule` border + `--radius`
3. **Respect nav inset** — pad bottom content with `calc(var(--nav-h) + var(--safe-bottom) + 16px)`
4. **Keep the 480px shell** — full-bleed elements still center via `.app-shell`
5. **Prefer Manrope** — reserve JetBrains Mono for numeric/meta labels
6. **Coral = action** — primary CTA, progress, selected states; don't introduce competing accent colors

---

## Related docs

- [README.md](./README.md) — setup & features
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel & env vars
- Native app reference: [fud-ai](https://github.com/apoorvdarshan/fud-ai) iOS/Android UI
