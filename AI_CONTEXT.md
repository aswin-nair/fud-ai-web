# Fud AI — context for AI coding agents

Handoff document. Read this before touching the repo.

---

## 1. The single most important fact: there are two apps

This repo contains **two separate applications** that both track food. Confusing
them is the most expensive mistake available here.

| | `web/app/` | `mobile/` |
|---|---|---|
| **Status** | **The live product.** Deployed to Vercel. | Second app, newer, not shipped. |
| Stack | Vite + React 19 + react-router-dom | Expo SDK 57 + React Native + expo-router |
| Language | TypeScript (strict) | TypeScript (strict) |
| Storage | `localStorage` | `expo-sqlite` + drizzle-orm |
| State | React Context (`store/AppContext.tsx`) | zustand stores |
| Styling | One large `src/index.css` + CSS custom properties | `src/theme/tokens.ts` |
| Look | **Coral / cream, warm, editorial** | Green / white |
| Dev server | `npm run dev --prefix web/app` → :5173 (or :5174) | `npm run web --prefix mobile` |

**Default assumption: work means `web/app/`** unless the request is explicitly
about React Native, Expo, SQLite or drizzle.

There is a `BUILD_SPEC.md`-style specification that circulates with this project.
It is written in Expo/React Native terms (design tokens in `tokens.ts`, expo-router
file routing, Reanimated). **Its §2 product rules apply to both apps. Its
Phase 1–4 implementation details describe the `mobile/` app only.** Applying its
literal file layout to `web/app` is wrong; applying its *rules and product
behaviour* to `web/app` is right.

---

## 2. What the product is

A food/calorie logging app built around a Duolingo-style habit loop: one small
daily action, immediate visible reward, a streak that compounds.

**The atomic action is logging one meal.** Everything exists to make that take
under 20 seconds and feel worth repeating tomorrow. Audience is adults building a
logging habit. It is **not** a medical device.

---

## 3. Non-negotiable product rules

These are **safety requirements, not preferences**. They override engagement,
retention and aesthetics. Do not implement anything that violates them, and do
not remove the code that enforces them.

### 3.1 Goal calculation floors
```
BMR     = Mifflin-St Jeor (Katch-McArdle when body fat % is known)
TDEE    = BMR × activity_multiplier
deficit = min(requested, TDEE × 0.25)          // cap deficit at 25%
floor   = sex === 'female' ? 1200 : 1500
target  = max(TDEE - deficit, floor, BMR)
```
- Rate of loss capped at **1% of bodyweight per week**.
- Goal weights implying **BMI < 18.5 are refused**, not clamped.
- **Never clamp silently** — always show a plain-language explanation.
- Implemented in `web/app/src/lib/profile.ts` → `computeTargets()`, which returns
  `{ calories, clamped, reasons }`. It is the *only* path to a calorie target and
  a hand-entered `customCalories` passes through the same floors.

### 3.2 Age gate
Onboarding collects date of birth **first** and runs the gate immediately, before
collecting height/weight. Under 18 → hard block, no bypass, no "continue anyway".
`web/app/src/pages/OnboardingPage.tsx` (`blocked` state).

### 3.3 Streak the logging, never the deficit
A day counts if the user logged **at least one meal**. It never depends on hitting
or staying under a calorie target. There is no penalty or negative state for going
over.

### 3.4 Over-budget is a neutral state
- Going over renders in a **lighter tint of the same colour** (`--on-track-soft`),
  never red, never a warning icon.
- `--danger` / `--danger-deep` are reserved **exclusively** for destructive UI
  (delete entry, delete account). They must never encode a nutrition state.
- **Banned words in all user-facing strings:** `bad`, `cheat`, `guilty`, `earned`,
  `burn it off`, `naughty`, `sinful`, `damage`.

### 3.5 Mascot reacts to logging, never to numbers
Six states: `idle | happy | celebrating | sleepy | proud | neutral`. Driven only
by logging behaviour and streak status — **never** by the calorie total, the macro
split, or a specific food. Going over target renders `neutral`, like any ordinary
day. **There is no sad, disappointed or crying state. Do not add one.**

### 3.6 Notifications
Maximum **two per day**, enforced in code (`lib/notifications.ts`, `MAX_PER_DAY`).
One routine nudge at the inferred logging time, one "save" nudge only when the
streak genuinely expires tonight. No guilt copy. Notifications never mention
calories, weight, or how much someone ate.

### 3.7 No public comparison
No leaderboards, no leagues, no public rankings of calories or weight. If social
is ever added it is opt-in, friends-only, and shares streak length only.

### 3.8 Off-ramps
- One free streak freeze per calendar month, auto-applied, never sold.
- **Pause tracking** — hides all numbers, holds the streak indefinitely.
- **Support** screen with eating-disorder helplines, reachable in two taps from
  Home (Settings → Support). US entry is the **National Alliance for Eating
  Disorders**. **Do not link NEDA** — its helpline is permanently disconnected.

---

## 4. `web/app` architecture

### Routes (`src/App.tsx`)
```
/login  /onboarding
/  (Home)  /progress  /coach  /journey  /settings  /about  /support
/log  /log/text  /log/photo  /log/saved  /log/manual  /discover
/review  /edit/:id
```
Unauthenticated → `/login`. Authenticated but not onboarded → forced to
`/onboarding`.

### Data model (`src/types.ts`)
`AppState` = `{ onboarded, profile, foodEntries, weightEntries, exerciseEntries,
favoriteMeals, chatMessages, aiSettings, gamification }`.

- `FoodEntry` — `{ id, name, calories, protein, carbs, fat, timestamp, emoji,
  source, mealType, servingSizeGrams?, ingredients? }`
- `FoodSource` — `'textInput' | 'manual' | 'snapFood' | 'quickAdd' | 'recent'`
- `GamificationState` — `{ xp, level, streakFreezes, freezeUsedDates,
  freezeEarnedMonth, xpEvents, pendingLevelUp, seenBadgeIds, quest? }`

### Persistence
`localStorage`, keyed **per user**: `fud-ai-web-state-<userId>`
(`lib/storage.ts`). No backend for app data. Export/import to JSON is supported.

### State
Single `AppContext` (`store/AppContext.tsx`) exposing `addEntry`, `updateEntry`,
`deleteEntry`, `toggleFavorite`, `logSavedMeal`, `addWeightEntry`, `addExercise`,
`replaceState`, `clearAllData`, `ackLevelUp`, plus `pendingAnalysis` used to hand
AI results between the log pages. `AuthContext` handles sign-in.

**`addEntry` runs the whole gamification advance** (`lib/gamification.ts` →
`advanceAfterLog`): XP awards, streak, quest sync, freeze application, level-up.
Do not award XP by hand elsewhere.

### Key modules
| File | Responsibility |
|---|---|
| `lib/profile.ts` | BMR/TDEE, **`computeTargets()` with all §3.1 floors**, macro goals |
| `lib/journey.ts` | `getStreakWithFreezes`, `getMonthConsistency`, badges, freezes |
| `lib/streak.ts` | Base streak walk |
| `lib/xp.ts` | Level thresholds, `levelFromXp`, XP award computation |
| `lib/quests.ts` | Daily quest generation, seeded by date so it is stable |
| `lib/gamification.ts` | `advanceAfterLog`, `openSession` |
| `lib/notifications.ts` | Two-per-day cap, copy, `routineHour` |
| `lib/analytics.ts` | Typed events → local ring buffer in `localStorage` |
| `lib/meals.ts` | Recents, favourites, `quickAddEntry`, `defaultMealType` |
| `lib/feel.ts` | Synthesised sounds + haptics, honours profile toggles |
| `lib/tokens.ts` | JS-side motion durations, ring geometry |
| `lib/dates.ts` | **`localDayKey()` — local calendar date, never UTC** |

### Auth
Local email/password (`lib/localAuth.ts`, stored in browser) **plus** Google
OAuth (`@react-oauth/google`). In dev, Google sign-in throws origin errors — this
is expected and harmless.

### AI features (BYOK)
Photo and text meal logging call an LLM using the **user's own API key**
(OpenRouter or Gemini), stored in-browser. `lib/aiClient.ts`, `lib/foodAI.ts`,
`lib/coachAI.ts`. No key ships with the app.

---

## 5. Design system

**The palette is coral/cream and must not be changed.** All tokens live at the
top of `src/index.css` under `:root`.

```css
--paper: #F6F1EA;  --paper-card: #FFFFFF;  --paper-deep: #EFE6D8;
--ink: #1A1A1A;    --ink-soft: #7A7266;    --ink-mute: #A69C8C;
--coral: #FF7A50;  --coral-deep: #E8623A;  --coral-soft: rgba(255,122,80,0.12);
--serif: 'Fraunces';  --sans: 'Plus Jakarta Sans';
```

Role-named tokens layered on top (added later, introduce no new hue):
`--on-track`, `--on-track-deep`, `--on-track-soft`, `--protein/--carbs/--fat`,
`--danger`/`--danger-deep`, `--space-*`, `--radius-*`, `--text-*`, `--motion-*`,
`--press-depth`.

**Use the role tokens for new work.** Colours are named by role, not by hue, so a
rebrand touches one block.

### Signature components
- **`PressableButton`** — the raised button. Two stacked layers (static shadow +
  face that translates 4px down on press). *Not* an animated border, which would
  reflow. Haptic fires on press, not release. At most one `primary` per screen;
  `destructive` only for delete.
- **`CalorieRing`** — SVG, rotated −90° to start at 12 o'clock, round cap,
  CSS transition on `stroke-dashoffset` so it animates from its current value
  rather than restarting from empty. Over target draws a second arc in
  `--on-track-soft` with a factual label.
- **`Mascot`** — SVG, six states, rounded shapes only. See §3.5.
- **`LogCelebration`** — full-screen post-log moment, itemises real XP awards.
- **`MascotSay`** — speech bubble, lines keyed to mascot state.

### Copy rules
Sentence case. Verb first ("Log a meal", not "Submit"). An action keeps its name
through the flow. Empty states are invitations, not apologies. Errors say what
happened and what to do, with no "Error:" prefix. **No exclamation marks** except
genuine milestones. Never moralise food — descriptive, never evaluative.

---

## 6. Testing and verification

```bash
npm run test     --prefix web/app   # vitest, 58 unit tests
npm run build    --prefix web/app   # tsc -b && vite build
npm run lint     --prefix web/app   # oxlint
npm run test:e2e --prefix web/app   # playwright
```

- **Unit tests are scoped to `src/**/*.test.ts`** via `vitest.config.ts`, so they
  do not collide with the Playwright specs in `e2e/`.
- **`TZ` is pinned to `America/New_York`** in `vitest.config.ts`. The streak tests
  cover both DST transitions and the local-vs-UTC day boundary; in UTC they would
  pass vacuously. There is a guard test that fails if the zone stops observing DST.
- `e2e/_*.mjs` are **ad-hoc verification scripts and are gitignored.** The
  convention is to write a throwaway `_probe-*.mjs` that drives the real app via
  Playwright, prints assertions, and screenshots. Use it — visual claims about
  this app should be verified, not assumed.
- **`npm run ci` does NOT run the unit tests.** It is
  `lint && build && test:e2e`. Adding `npm test` to that chain is an open task.

---

## 7. Traps

1. **Two apps.** See §1. Check which one the request is about.
2. **`localDayKey()` is local, not UTC.** Never use `toISOString().slice(0,10)`
   for a calendar day — a 23:30 log in New York is the next day in UTC and the
   streak breaks.
3. **Never award XP outside `addEntry`.** It runs the full advance.
4. **`location.key` effects on Home.** The post-log effect calls
   `navigate('.', { state: null })` to clear router state, which changes
   `location.key` — its own dependency. A `setTimeout` started in that effect is
   killed by its own cleanup before it fires. Reset timers must be keyed to the
   state value itself. This bug has already been fixed twice; do not reintroduce it.
5. **Screenshots in `web/app/*.png`** (`p5-` … `p10-`) are verification artifacts,
   deliberately untracked. Do not commit them.
6. **Google OAuth 403 / GSI origin errors in dev are pre-existing** and unrelated
   to whatever you just changed.
7. **Do not change the palette.** See §5.

---

## 8. Current state

Implemented in `web/app`: onboarding with age gate, clamped goal calculation with
explanations, Home (streak badge, XP bar, mascot + speech bubble, calorie ring,
macros, quest, meals by slot, pinned raised log button), search-first log flow
with recents/favourites and quick add, AI photo/text logging, manual entry, saved
meals, Progress led by logging consistency, journey/badges, coach chat, settings
with pause tracking, support screen, export/import.

Known gaps:
- Macro cards and activity chips still use the older three-card treatment rather
  than the labelled progress-bar group.
- `npm run ci` does not run unit tests.
- Sub-20-second log time and haptics are unverified on real hardware.
- The `mobile/` app is at feature parity through its own Phase 7 but is not
  shipped.
