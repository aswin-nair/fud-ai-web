# Momo, unscripted — a plan for an AI-driven mascot

Status: **web implementation completed on 2026-08-31.** Live BYOK dialogue,
runtime output safety, contextual reactions, batched caching, settings controls,
and the illustrated animated Momo are in the working tree. Web, mobile, and
shared-product unit suites pass; the local production build passes. Browser
visual QA is awaiting local-page permission.

Grounded in a read of `main` at `a075c23`.

## Implementation outcome

- Live dialogue uses the configured OpenRouter or Gemini model when an API key
  is present and **Momo live AI** is enabled.
- The model receives categorical interaction context only: screen, mood, time
  band, consistency band, presence state, event, and poke stage. It never
  receives meal names, typed text, nutrition values, targets, weight, or raw
  provider errors.
- Generated lines are batched, cached in memory, checked at runtime, and read
  synchronously from the pool on repeat interactions. Empty pools show a short
  thinking performance while they refill. Provider failure falls back safely.
- Momo now reacts to successful logs, milestones, invalid forms, failed AI
  requests, empty saved-item searches, returns, completed day rings, ambient
  moments, and escalating taps.
- Settings expose live AI on/off plus Warm, Witty, and Sassy personalities.
- Her SVG was redrawn with a pleated silhouette, dimensional dough, expressive
  eyes and brows, gesture-specific arms, a signature blossom, celebration
  sparks, a thinking orbit, and reduced-motion fallbacks.

---

## 0. The ask, and the thing it collides with

You want Momo to stop feeling like a lookup table — dynamic dialogue, dynamic
interaction. That is the right instinct and §1 shows the staleness is real and
measurable.

It collides with one thing, and the whole plan is shaped by it:

> **§3.5 — the mascot reacts to logging, never to numbers.** Six states, driven
> only by logging behaviour and streak status. Never by the calorie total, the
> macro split, or a specific food. There is no sad, disappointed or crying state.

Today that rule is enforced by `mascotVoice.test.ts` running regexes over a
**finite, committed list of lines**. Every word Momo can ever say is provably
inside the rule before the app ships.

A live language model has no finite list. The enforcement has to move from
*"assert the corpus"* to *"filter every utterance at runtime"* — and the app has
no output filter today. `coachSafety.ts` screens what the **user types**, not what
the model returns. That gap is the single biggest piece of work here, and it is
why this plan does not simply swap `mascotVoice.ts` for an API call.

This is not an argument against the feature. It is the reason the feature needs
three tiers instead of one.

---

## 1. Why it feels static — measured, not impressions

The whole corpus is **18 ambient lines across six states, plus 9 poke beats**:

| State | Lines |
|---|---|
| `sleepy` | 4 |
| `idle` | 4 |
| `happy` | 3 |
| `celebrating` | 2 |
| `proud` | 3 |
| `neutral` | 2 |

But the shallow corpus is not the main problem. **The selection is deterministic
on a value that barely moves.** `HomePage.tsx:233`:

```tsx
<p className="home-ring-say">{ambientLine(voiceState, dayEntries.length)}</p>
```

`ambientLine` picks with `seed % options.length`. The seed is *today's meal
count*. So:

- Open the app at 8am with two meals logged → line X.
- Open it at 2pm, 6pm, 11pm with two meals logged → **line X, every time.**
- The line can only change by logging something.

Momo repeats himself all day and then changes his mind exactly when you eat.
That is the staleness, and **it is a one-line bug, not a missing language model.**

Two smaller contributors:

- **No sense of occasion.** There is no line for first-log-of-the-day, for coming
  back after four days away, for a ring arc closing, for the small hours. State
  is one of six buckets and nothing else reaches the voice.
- **The poke ladder is a fixed 1:1 pairing.** `pokeAct(n)` always maps poke 3 to
  `poke_squish` + *"You are still poking."* Pose and line never recombine, so the
  ninth poke of every session is identical to the ninth poke of every other.

---

## 2. Three constraints any answer must satisfy

**Latency.** Every call site is synchronous today — `HomePage.tsx:233`,
`MascotOverlay.tsx:172`, `MascotRoamer.tsx:106`. Poke → wobble → line, instantly.
A 1–3s pause before a reaction does not read as "thinking", it reads as broken.
**Nothing may block on a network call.**

**BYOK.** `aiSettings.apiKey` is empty by default and `APPSTORE.md` states managed
AI cannot be purchased or used. Most users have no key at all. **Momo must be
fully alive with no key**, which means the static repertoire gets extended, never
deleted.

**Cost and rate.** Poking is spammy *by design* — the joke is escalation. One API
call per poke, on the user's own key, is not acceptable.

---

## 3. The proposal: three tiers

### Tier 0 — Make it non-deterministic (no AI at all)

Fix the seed, then give the voice more to react to.

- Seed ambient selection from `(dayKey, hour-bucket, entry count)` instead of
  entry count alone, so the line moves through the day.
- Track the last line shown per state in session storage and exclude it, so the
  same line never appears twice running.
- Add the context slots the voice cannot currently see: **time of day**,
  **first log of the day**, **returning after a gap**, **an arc just closed**,
  **a streak milestone**. These are all already computable — `dayRingProgress`,
  `getStreakWithFreezes` and the entry timestamps have everything needed.
- Decouple pose from line in the poke ladder: keep the escalation *curve* but
  pick within a tier, so poke 3 is put-upon without being word-for-word the same
  put-upon.

**This is hours of work, needs no key, adds no risk, and removes most of what
you are reacting to.** It should ship regardless of what happens with tiers 1–2.

### Tier 1 — AI-authored corpus, generated offline (recommended core)

Use a model **at authoring time, not runtime**. Generate several hundred lines
per state and context slot, hand-review them, commit them as data, and run the
existing `mascotVoice.test.ts` contract across the whole corpus.

| Property | Result |
|---|---|
| Variety | Hundreds of lines instead of 18 |
| Latency | Zero — it is still a local lookup |
| Cost to user | Zero |
| Works without a key | Yes |
| Safety | **Still provable at build time**, same as today |

This is the highest value-to-risk ratio in the plan. It gets AI-quality writing
and context coverage while keeping the property that makes the current system
trustworthy: every possible utterance is reviewed before shipping.

### Tier 2 — Live generation, opt-in and pre-fetched

For users who have a key and switch it on:

1. On session open, generate a **batch** of 10–20 lines for the states likely to
   come up, in the background.
2. Validate each line through a new output filter (§4). Discard failures silently.
3. Cache the survivors. Call sites read from cache **synchronously** — the
   existing signatures do not change.
4. Empty cache, network failure, no key, or every line rejected → fall through to
   Tier 1. The user sees a mascot that works, never a spinner or a gap.

This is what makes Momo genuinely responsive to *this* person's week rather than
picking from a list, and because it is batched and pre-fetched it costs roughly
one call per session rather than one per poke.

---

## 4. The new safety machinery Tier 2 requires

**`mascotOutputSafety.ts`** — the inverse of `coachSafety.ts`. It screens
generated text before display, using the regexes `mascotVoice.test.ts` already
encodes:

- banned vocabulary — `bad`, `cheat`, `guilty`, `earned`, `naughty`, `sinful`, `damage`
- food, body and judgement words — `calorie`, `kcal`, `weight`, `diet`, `deficit`, `too much`, `too little`
- cruelty — `stupid`, `useless`, `pathetic`, `failure`, `shame`, `disgusting`
- **plus, new:** no digits at all, and a hard length cap

A line failing any check is discarded, not sanitised. With a batch of 20 the
loss of a few costs nothing.

**A context guardrail on the prompt.** `buildCoachSystemPrompt` deliberately
receives calories, macros and targets. **The mascot prompt builder must not.** Its
entire input is: mascot state, poke count, time of day, streak length, and
whether an arc closed. A test should assert the builder cannot read calorie,
macro or target fields — the same shape as the `dayRing` guardrail in
`packages/product/src/dayRing.test.ts`.

This matters because a model handed the number *will* eventually comment on it,
and the moment Momo says "that's a big lunch" the app has broken its central
safety promise to a user who may have an eating disorder.

**Prompt-injection surface.** Food names are user-controlled and reach the model
if meal context is ever included. Recommendation: **the mascot prompt never
includes food names.** Coach can have them; the mascot does not need them.

---

## 5. The interaction axis — worth more than the words

You said dialogue *and* interaction. The behavioural half needs no model at all
and is probably the bigger win:

- **Momo currently only reacts to being poked and to logging.** He could react to
  what is happening: lingering on a screen, opening the app after days away, a
  ring arc closing under the current commitment level, the small hours.
- **Anchors already exist.** `mascot/anchors.tsx` can place him at the streak
  chip, the ring, the FAB, a quest card. He can go *stand next to the thing that
  just changed* instead of drifting.
- **The pose vocabulary is only used for pokes.** Eight poses exist; nothing but
  poking triggers them.

A mascot who moves to the right place at the right moment reads as far more
alive than one with better sentences, and none of it costs a token.

---

## 6. One structural cleanup first

The poke repertoire now exists in **two places**: `web/app/src/lib/mascotVoice.ts`
and `packages/product/src/mascotPoke.ts` (which mobile imports). They are already
copies of each other.

Mobile has its own `components/momo/MomoOverlay.tsx` reading from the shared
package while web reads its local file. **Any voice work must consolidate into
`packages/product` first**, or every line added lands on one platform and the two
Momos drift apart.

---

## 7. Sequencing

| Phase | Contents | Risk |
|---|---|---|
| **0** | Consolidate the voice into `packages/product` | None — deletion of a duplicate |
| **1** | Tier 0: fix the seed, no-repeat, new context slots, decouple pose from line | Low, no key needed |
| **2** | Tier 1: AI-authored corpus, reviewed and committed | Low — safety still build-time |
| **3** | Interaction axis: anchor-aware movement, poses beyond poking | Low |
| **4** | `mascotOutputSafety.ts` + prompt context guardrail + tests | The real safety work |
| **5** | Tier 2: opt-in live batches behind the filter | Only after phase 4 lands |

Phases 0–2 alone would likely settle the complaint. Phase 5 is the only one that
needs the safety re-architecture, which is why it sits last rather than first.

---

## 8. What must not break

- **§3.5** — never reacts to numbers; no sad, disappointed or crying state, and a
  model must not be able to invent one
- **§3.4** — no moralising vocabulary; `copy-policy.test.ts` covers source, and
  `mascotOutputSafety.ts` must cover runtime
- **Latency** — no call site becomes async
- **BYOK** — full character with no key
- **§3.8** — nothing here touches the Support off-ramp

---

## 9. Open questions

1. **Is live generation (Tier 2) wanted at all**, given that Tier 1 delivers most
   of the variety with build-time-provable safety and no user cost? My
   recommendation is to ship 0–2, live with it a week, and decide Tier 2 with
   real usage rather than in advance.
2. **Should Momo ever comment on food at all?** Today the rule is absolute and I
   would keep it. Worth an explicit decision, because a mascot that cannot
   mention food is a deliberate character constraint, not an oversight.
3. **Voice budget** — if Tier 2 ships, what is the per-session call ceiling?
4. **Does mobile get parity in the same pass**, or does web lead and mobile
   follow? Phase 0 makes either possible; doing them together costs less.
