# Engagement plan — applying two videos to Fud AI

Status: **implemented and verified in the working tree on 2026-08-30.** 699 unit
tests, 30 e2e tests, lint and build all pass; Discover and onboarding checked
visually at 420×900. Not yet committed.

Implementation decisions:

- Guest progress is staged into the authenticated durable record and then uses
  the existing server/device conflict path. The guest source is retained until
  the account copy is acknowledged.
- Gems and purchases are removed from the live product. Legacy fields remain as
  migration-only state so old backups continue to load.
- The Day ring replaces quests, and the freed navigation slot is now Discover.
- Capture latency is not collected. Food vocabulary and honest milestones carry
  the competence signal without making meal timing feel surveilled.

Grounded in a read of `main` at `0652e28`, and in the actual content of the two
videos supplied — not in a general impression of what they probably said.

---

## 0. Provenance

| | Video A | Video B |
|---|---|---|
| Title | The UX Psychology Behind Apps People Can't Stop Using | I Studied 500+ Gamified Apps (Here's What Actually Works) |
| Channel | uxpeak | Tim Gabe |
| Reach / length | 438k views | 12:33 |
| What it gives | 6 psychology principles, each with a before/after screen | 7 research-backed patterns, each with a named company and a cited study |

**How the content was recovered.** YouTube's transcript endpoint is closed to
automated clients now. Video B's transcript was recovered by playing the video at
8× and capturing the caption track off the player. Video A resisted the same
method; its six principles come from two independently published summaries that
agree with each other line for line.

Both videos are paraphrased throughout this document rather than quoted at
length. The findings and statistics attributed to each are theirs; the wording
and the application to Fud AI are mine.

The two videos disagree with each other on one important point, and that
disagreement turns out to be the most useful thing in them. It is resolved in §5.

---

## 1. The thirteen principles, scored against this app

| # | Principle | Source | Verdict |
|---|---|---|---|
| A1 | Smart defaults — 70–90% of users never change a default | A | **Partly done**, one gap |
| A2 | Goal gradient — never start the user at zero | A | **Already done** |
| A3 | Reciprocity — give value before the signup wall | A | **Adopt — highest leverage** |
| A4 | IKEA effect — let them build something before they commit | A | **Adopt (same change as A3)** |
| A5 | Loss aversion — show what they stand to lose | A | **Reject** |
| A6 | Contrast effect — anchor the price against a bigger number | A | **Not applicable** |
| B1 | PBL fallacy — points/badges/leaderboards are the scoreboard, not the game | B | **Adopt** |
| B2 | Winnable local competition, not one global ranking | B | **Adopt in the solo form** |
| B3 | S-curve — past a point, more mechanics *reverse* engagement | B | **Adopt — the central finding** |
| B4 | Streak trap — streaks drift from motivation to obligation | B | **Mostly done**, one gap |
| B5 | Variable reward magnitude — anticipation, staged reveal | B | **Adopt the pacing, reject the variance** |
| B6 | Completion drive — Gestalt closure, the Apple Watch rings | B | **Adopt — the structural change** |
| B7 | Competence over badge theater | B | **Adopt** |

Four of the thirteen are rejected or inapplicable. Two are already handled well.
That leaves seven real changes, which collapse into five pieces of work.

---

## 2. The central finding: this app is past the peak of the S-curve

Video B's third pattern cites a 2025 peer-reviewed study in Frontiers in
Psychology finding that gamification feature richness follows an S-shaped curve.
Adding mechanics helps engagement up to a point — and past that point, adding
more actively reverses it. Its stated warning sign is an app stacking streaks *and*
points *and* badges *and* challenges *and* leaderboards.

Here is what Fud AI currently stacks. Twenty-five distinct mechanics:

| # | Mechanic | Defined in | Visible where |
|---|---|---|---|
| 1 | Meal XP (legacy path) | `lib/xp.ts` `computeXpAwards` | celebration feed |
| 2 | Enamel XP (second path) | `lib/enamelEconomy.ts` `ENAMEL_XP` | Home chip, celebration |
| 3 | Levels 1–10, named, with companion emoji | `lib/xp.ts` | `LevelUpOverlay` |
| 4 | Gems (second currency) | `lib/enamelEconomy.ts` | Home chip, Settings |
| 5 | Cosmetics shop, 6 items | `enamelEconomy.ts` `COSMETICS` | `SettingsPage:283` |
| 6 | Badges, 14 | `lib/journey.ts` `BADGE_DEFS` | a toast, nothing else |
| 7 | Badges, 9 — **a second, separate list** | `lib/streak.ts` `getBadges` | **nowhere** |
| 8 | Daily quest (legacy) | `lib/quests.ts` | **nowhere** |
| 9 | Enamel daily quests, 3 drawn from 8 | `enamelEconomy.ts` | Quests tab |
| 10 | Enamel weekly quest, 1 drawn from 3 | `enamelEconomy.ts` | Quests tab |
| 11 | Streak | `lib/streak.ts`, `lib/journey.ts` | Home chip, Insights |
| 12 | Streak freezes — monthly, at day 7, purchasable | `journey.ts`, `enamelEconomy.ts` | Settings |
| 13 | Streak repair, 200 gems, 2-day window | `enamelEconomy.ts` | Settings |
| 14 | Journey stages, 6, named, with taglines | `lib/journey.ts` `JOURNEY_STAGES` | **nowhere** |
| 15 | Daily XP goal of 80 | `DAILY_XP_GOAL` | Home chip |
| 16 | Water, 8 glasses | `Ticket` | Ticket |
| 17 | Kitchen notes, 3/day | `Ticket` | Ticket |
| 18 | Ticket number | `enamelEconomy.ts` `ticketNumber` | Ticket |
| 19 | Mascot: 6 states, roaming, poke reactions | `mascot/` | overlay |
| 20 | Level-up overlay + confetti | `LevelUpOverlay` | on level |
| 21 | Log celebration | `LogCelebration` | on log |
| 22 | Consistency heatmap | `ProgressPage` | Insights |
| 23 | Chest | `JourneyPage` | Quests |
| 24 | Streak milestones, 8 tiers, +50 XP each | `gamification.ts` | celebration |
| 25 | Quest completion bonus, +25 XP | `gamification.ts` | celebration, **for an invisible quest** |

Video B's named cautionary case is Habitica — the most aggressively gamified
productivity app ever shipped, where tasks become quests and missing one costs
you HP. The peer-reviewed study it cites found that **100% of participants
experienced counterproductive effects**: users became so absorbed in managing the
game layer that the actual behaviour got buried underneath it.

Fud AI's actual behaviour is *log a meal in under fifteen seconds*. Every one of
the twenty-five surfaces above competes with that behaviour for attention. Two
currencies, two XP paths, two quest systems, two badge lists, three separate
progress ladders (levels, journey stages, daily XP goal), and a shop.

This is the Habitica shape. **The single most valuable change available is
subtraction.**

---

## 3. Dead weight — fix this regardless of what else is approved

Four systems are fully built, run on every log, and are rendered nowhere. These
are not judgment calls.

**3.1 The legacy quest system awards XP for a quest nobody can see.**
`gamification.ts` `advanceAfterLog` runs `syncQuest()` and, on completion, adds a
`+25 XP` event labelled `Quest completed`. Nothing in `web/app/src/**/*.tsx` reads
`gamification.quest` or calls `questTitle`. A user sees "Quest completed +25" in
the celebration feed for a quest that was never shown, never explained, and cannot
be found anywhere in the app. That is worse than having no quest at all.
→ Remove `lib/quests.ts` from the live path; keep the `quest` field in state as a
migration no-op.

**3.2 `lib/streak.ts` `getBadges` — a nine-badge list with zero importers.**
Superseded by `journey.ts` `getAllBadges` (14 badges). The `Badge` interface and
`getSeenBadgeIds` in the same file go with it.
→ Delete.

**3.3 `JOURNEY_STAGES` — six named stages, dead.**
Six stages with names, taglines, companions, terrain and colours, plus
`getJourneyStage` and `getNextStage`. No `.tsx` file imports any of them; the
Journey route renders quests instead.
→ Delete, or promote (see C3 — I recommend delete).

**3.4 Two XP paths run on the same log.**
`computeXpAwards` (legacy) and `applyEnamelLogAwards` (enamel) both fire inside
`advanceAfterLog`. A user's XP total is the sum of two independently designed
economies that were never reconciled.
→ Collapse to the enamel path.

Doing only §3 removes four systems and one genuine user-facing defect, with no
design decision required.

---

## 4. The account wall is the highest-leverage single change

Video A's principles 3 and 4 are two halves of one move.

**Reciprocity.** Its before/after is a results screen locked behind "Create an
account to see your report", versus showing a real partial result first and *then*
offering to save it. The supporting claim is that free samples lift purchase rates
dramatically, because receiving something first creates an obligation to
reciprocate.

**IKEA effect.** Its cited example is Duolingo: pick a language, set a goal, finish
a first lesson — roughly ten minutes of built value before sign-up is ever
mentioned. Abandoning then feels like losing something you made. The specific
advice is to relabel the button from "Sign up" to "Continue".

**Fud AI today does the exact opposite.** `App.tsx:99-105`: an unauthenticated
visitor can reach `/login`, `/forgot-password`, `/reset-password` — and nothing
else. Every other path redirects to `/login`. There is zero product before the
wall.

The irony is that **the onboarding is already built exactly the way Video A
recommends.** `OnboardingPage.tsx:33`:

```
const STEPS = ['Age', 'About you', 'Goal', 'Body', 'Activity', 'Review', 'First meal']
```

Seven steps of personalisation ending in the user logging a real first meal. That
is the Duolingo flow. It is simply sitting on the wrong side of the wall.

### C1 — Move the wall to after the first meal

1. `/onboarding` becomes reachable unauthenticated.
2. The age gate stays step 0 and stays absolute. **§3.2 is not negotiable**, and
   date-of-birth-first is fully compatible with this change.
3. Onboarding writes to the existing local-only durable record. `durableState.ts`
   and `localAuth.ts` already support a device-local mode, so the storage work is
   small.
4. After `finishWithFirstMeal()` the user lands on Home with a logged meal, a
   moving ring and a streak of 1 — and then sees "Save your progress", not
   "Sign up".
5. The wall itself becomes a real reciprocity moment: they are protecting
   something they built, not opening an empty account.

Risk to settle before building: how the local record is claimed at sign-up, and
what happens when a device-local user signs into an account that already holds
cloud state. The existing `/api/state` conflict path (server/device choice with an
exported copy) is the pattern to reuse.

---

## 5. The disagreement between the two videos — and how it resolves

Video A's fifth principle advises loss-aversion framing: name the files at risk,
add a countdown, and label the dismiss button something self-deprecating like
"I'll risk it." It grounds this in Kahneman — losses register roughly twice as
strongly as equivalent gains.

Video B's fourth pattern says this is precisely the mechanic now drawing
regulators. Its evidence:

- Research from the Decision Lab finds streaks drift from motivational to
  obligational the longer they run — from *I want to* toward *I can't miss today*.
- A 2023 Belgian study of nearly 2,500 adolescents found Snapchat streak frequency
  correlating with FOMO, problematic smartphone use, and reduced self-control.
- The Nevada Attorney General filed litigation against Snapchat in 2024.
- The EU Digital Fairness Act, heading toward a legislative proposal in late 2026,
  is aimed specifically at addictive streak mechanics.

Its framing of the alternative is the sharpest line in either video: streaks run
on fear of losing what you have built, while anticipation runs on the pull toward
what comes next — the same surface behaviour driven by opposite emotional engines,
and only one of them recharges itself.

**Video B is right and Video A is wrong for this app.** A calorie-tracking app is
used by people who may be at risk for disordered eating; §3.4 already bans guilt
copy and §3.6 already bans guilt notifications. Loss framing would also fail
`copy-policy.test.ts`, which blocks the word *earned* among others.

**A5 is rejected in full.** No countdowns, no at-risk framing, no self-deprecating
dismiss labels, no "don't lose your streak" push copy.

Worth stating plainly: Video B's checklist for a defensible streak is that the
user can choose their own goal level and can freeze it — the mechanic has to be
wrapped in agency. What it flags as indefensible is a streak you cannot pause,
influence, or escape.

Fud AI already ships a free monthly freeze, a free freeze at day 7, a purchasable
freeze, a repair window, and an indefinite pause that holds the streak. On this
specific axis **the app is already ahead of most of the 500 in the study.** The
one missing piece is C5.

---

## 6. The changes

### C2 — One day-ring, built from logging, not from calories

This is the structural change. Video B rates completion drive as its single most
important pattern, and its case study is the Apple Watch: three rings, close all
three to complete the day, and a reported 49.5% behaviour change across 160,000
people. The mechanism is the Gestalt principle of closure — the brain reads an
incomplete pattern as demanding completion, so a 90%-filled circle is an open loop
it wants to shut. Its measured outcome is real rather than cosmetic: regular
ring-closers were 48% less likely to report poor sleep quality.

**The problem.** Fud AI already has the closure-shaped object — `CalorieRing` is
the hero of Home. But it is pointed at the one number the safety rules refuse to
gamify. Closing it means eating to a target, and §3.3 and §3.4 exist precisely to
prevent that. So the app spends its strongest visual on a loop it must not ask
anyone to close, while the behaviour it *does* want — logging — is scattered
across an XP chip, a gem chip, three quest cards, a chest and a ticket.

**The change.** Keep `CalorieRing` as a factual readout, exactly as §3.4 wants.
Add a **Day ring** of three arcs, all built from logging behaviour the safety
rules already bless:

| Arc | Closes when | Already exists as |
|---|---|---|
| **Logged** | at least one entry today | the streak-bearing act, §3.3 |
| **Meals** | breakfast, lunch and dinner slots covered | the `three_mains` quest |
| **Detail** | one photo, note or serving correction today | `PHOTO` / `NOTE` XP |

Closing all three completes the day. This replaces the XP chip, the daily quest
cards and `DAILY_XP_GOAL = 80` with a single object — three mechanics become one,
which is the S-curve moving in the right direction.

Two safeguards, both load-bearing:

- **The streak attaches only to the innermost arc.** Logging one thing keeps the
  streak. The outer two arcs are upside-only and carry no penalty, so the ring
  cannot become a daily obligation with teeth. This is what stops C2 recreating
  the streak trap it is meant to replace.
- **The ring never reads calories, macros or targets** — the same guardrail as the
  header comment on `enamelEconomy.ts`, with a matching test.

### C3 — Six ladders down to two

Video B's first pattern is the PBL fallacy: points, badges and leaderboards are
the three mechanics every app reaches for first, and the three most documented
failures in product history. LinkedIn quietly retired its Top Voice gold badges in
2024 after finding badge-motivated users produced quantity over quality; Foursquare
scrapped mayorships and badges in 2014; Google News killed its badges for the same
reason. The line it borrows from Yu-kai Chou is that PBL is a game's scoreboard,
not the game — and most apps build the scoreboard and forget to build the game.

Current ladders: XP levels (10), journey stages (6, dead), daily XP goal, badges
(14 live + 9 dead), gems, cosmetics. Proposed:

| Keep | Cut | Reason |
|---|---|---|
| Streak | Gems | Second currency with no game attached to it |
| Day ring (C2) | Journey stages | Dead code (§3.3) |
| XP + levels | Daily XP goal | Absorbed into the ring |
| | Legacy quests + legacy XP | Dead / duplicated (§3.1, §3.4) |
| | The 9-badge list | Dead (§3.2) |

Keep the six cosmetics but unlock them from streak and milestones directly —
`COSMETICS` already carries an `unlockStreak` field, so cutting gems costs the
shop nothing but its currency.

Also: put the cosmetics **on Momo**, who is already on screen. A cosmetic bought
in Settings and never seen anywhere is the purest possible form of
scoreboard-without-a-game.

### C4 — Stage the reward reveal. Do not randomise it.

Video B's fifth pattern is variable reward magnitude, illustrated with a card-pack
opening flow in three stages: **anticipation** (you tap a pack with no idea what
is inside), **reveal** (cards flip one at a time, each one resetting the
anticipation cycle — the same data turned from one event into five), and
**celebration** (the screen reacts: glow, haptics).

`LogCelebration` currently receives `awards` as an array and presents them at
once. A single log can carry four or five separate awards — first of day, new
food, photo, quest, streak milestone. That is already five events being spent as
one.

**Adopt:** reveal awards sequentially, one at a time, each with its own beat.
`feel.ts` and `useHaptic` already provide the per-item haptic. This is a
presentation change to one component; the economy underneath does not move.

**Reject the variance.** Do not randomise reward magnitude. Variable-ratio
scheduling is the mechanic most associated with compulsive use, and this app's
users may include people with disordered eating. The honest version is just as
strong: magnitude here is *deterministic but not pre-announced* — the user
genuinely does not know this log also counts as their first of the day and a new
food until the reveal shows them. That is real anticipation with no slot machine
in it.

### C5 — Let the person set their own commitment level

The one gap in an otherwise strong streak design. `DAILY_XP_GOAL` is hard-coded at
80, and what counts as a qualifying day is fixed in code. Video B's reading of why
Duolingo's streak survives where others burn out is that users choose their own
goal level and can freeze it — the mechanic is wrapped in agency rather than
imposed.

Add one onboarding step and a matching Settings row: *How often do you want to
log?* — **Light** (one meal a day), **Regular** (three meals), **Detailed** (three
meals with a photo or note). The choice sets which arcs of the Day ring count
toward a complete day. Changeable at any time, downward without penalty and
without losing the streak.

This is the highest value per line of code on the list: it converts the streak
from something imposed into something chosen, which is exactly the distinction the
regulatory pressure in §5 turns on.

### C6 — Badges that signal competence, not attendance

Video B's seventh pattern cites a 2024 Springer Nature meta-analysis with an
uncomfortable result: gamification reliably improves a user's sense of autonomy
and relatedness, but has minimal effect on **competence** — the psychological need
most tied to long-term intrinsic motivation. Most apps engineer recognition and
forget to engineer mastery. Its counterexamples are Peloton (members using the
social and output features work out 15% more often, driven by real-time output and
auto-flagged personal records rather than by competition), Chess.com's ELO, and
Garmin's training-readiness scores. The rule it lands on: build mechanics that
signal the user got better at the actual thing, not that they opened the app a lot.

Of the 14 badges in `BADGE_DEFS`, 11 are attendance — meal counts and streak
lengths. Only the three `unique_*` variety badges touch skill at all.

The skill this app actually teaches is **knowing and capturing what you eat**. Two
competence signals are already computable from existing data:

- **Capture latency** — minutes between the meal `timestamp` and the log being
  written. Getting closer to real time is a genuine skill, and
  `docs/research/logging-speed-protocol.md` already treats speed as a product
  metric.
- **Food vocabulary** — `uniqueFoodCount` already exists. "You've logged 50
  distinct foods" is a statement about the user, not about their attendance.

The video's own caveat protects some of what already exists: a 100-ride badge is
not theater, because it stands for 100 actual rides. So milestone badges are not
automatically empty. Keep a small set of honest milestones, cut the streak-length
ladder from five tiers to two, and add the two competence signals above. Target
roughly six badges — and surface them somewhere other than a toast that vanishes.

### C7 — Winnable comparison, against your own past only

Video B's second pattern is Strava, which it treats as the counterexample to the
PBL fallacy: 180 million users and roughly an hour of real-world activity per two
minutes spent in the app. The mechanism is segments — rather than one global
leaderboard, thousands of hyper-local micro-competitions on the specific hill you
run past. Its stated reason this works is **winnability**, which a 2022
ScienceDirect study found to be the strongest predictor of competitive motivation.
The lesson it draws is to engineer the *size* of the competition rather than
inflate the metric.

§3.7 forbids leaderboards, and the video substantially agrees that the *global*
leaderboard is the failure mode. The transferable idea is the sizing — and the
smallest winnable competition is the user against their own recent past.

On Insights, beside the consistency heatmap: *"You logged breakfast 4 of the last
7 days. Your best is 6."* One winnable target, no second person involved, no
calorie or weight number in it. Fully compatible with §3.7.

### A1 — the one smart-defaults gap

Video A's first principle is that 70–90% of users never change a default, so a
pre-filled field is read as a recommendation and turns the task from creation into
adjustment. `ReviewFoodPage` pre-fills from the AI and `inferMealType()` defaults
the meal slot by hour — both correct. `ManualEntryPage` still opens on blank
numeric fields. Since `lib/meals.ts` already computes recents, defaulting manual
entry from the closest recent food — adjustable, clearly labelled — is a small
change against that statistic.

### A2 — already correct; do not regress

Video A's second principle is the goal gradient: never show 0%, because perceived
momentum drives completion. Its cited evidence is the loyalty-card study where
cards pre-stamped twice were completed at nearly double the rate of blank ones.

`OnboardingPage.tsx:299` starts the progress bar at 1/7, not 0. And
`finishWithFirstMeal()` calls `addEntry`, so a new user reaches Home with a meal
logged, a streak of 1 and XP already on the board. That is the finding implemented
correctly. **Whatever C1 does to the flow, this property must survive it.**

---

## 7. Explicitly rejected

| Rejected | Source | Why |
|---|---|---|
| Loss-aversion framing, countdowns, "I'll risk it" | A5 | §3.4, §3.6, `copy-policy.test.ts` — and Video B names it as the regulated pattern |
| Price anchoring / contrast effect | A6 | No paywall: free, open source, BYOK (`APPSTORE.md`). Revisit only if that changes |
| Randomised reward magnitude | B5, literal reading | Variable-ratio scheduling against an at-risk population. Take the pacing, not the variance |
| Leaderboards, leagues, public ranking | B2, literal reading | §3.7. The solo form in C7 is the version that transfers |

---

## 8. Sequencing

| Phase | Contents | Shape |
|---|---|---|
| **0** | §3 dead weight — legacy quests, dead badge list, dead stages, duplicate XP path | Deletion only. No design decision. Ship first |
| **1** | C1 account wall | Highest leverage. Touches routing and the local/cloud claim path — the one genuinely risky piece |
| **2** | C2 Day ring + C3 ladder cuts | The structural change; do them together, since C2 absorbs what C3 removes |
| **3** | C5 commitment level, C4 staged reveal | Small, high value, low risk |
| **4** | C6 badges, C7 own-past comparison, A1 manual defaults | Polish |

Phase 0 is worth shipping on its own merits whether or not the rest is approved.

---

## 9. What must not break

Every change above is subordinate to these. No item in this plan may weaken them,
and each carries an existing test or should get one.

- §3.1 goal floors — `computeTargets()` stays the only path to a calorie target
- §3.2 age gate first, hard block, no bypass — **survives C1 unchanged**
- §3.3 the streak counts logging, never the deficit — **the C2 safeguard**
- §3.4 over-budget is neutral; no `bad` / `cheat` / `guilty` / `earned` / `damage` — `copy-policy.test.ts`
- §3.5 the mascot never reacts to numbers; there is no sad state
- §3.6 two notifications a day maximum, no guilt copy — `notifications.ts`
- §3.7 no leaderboards — **bounds C7**
- §3.8 freeze, pause and Support reachable in two taps
- New guardrail to add: the Day ring must not read calories, macros or targets —
  same test shape as the `enamelEconomy.ts` header comment

---

## 10. Resolved implementation choices

1. **C1 claim path:** reuse the existing conflict flow; never delete the guest
   source before durable acknowledgement.
2. **Gems:** cut from all live earning, spending, and display paths.
3. **C2 scope:** replace Quests outright; keep `/journey` as a redirect for old
   bookmarks.
4. **Capture latency:** do not collect it. The privacy cost outweighs the value.
