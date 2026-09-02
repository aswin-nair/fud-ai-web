/**
 * Everything Momo says, for both platforms.
 *
 * Momo is allowed to be cheeky about being POKED. He is never cheeky about
 * food, eating, weight or a body — §3.4 bans moralising about food and §3.5
 * keeps him blind to every number. So the banter is about the poking, the
 * waiting and his own dignity, and about nothing else.
 *
 * That is not a convention, it is asserted: mascotVoice.test.ts runs the copy
 * rules over `allLines()`, which must stay exhaustive. A new pool that is not
 * reachable from `allLines()` is a pool nobody checked.
 *
 * This module is deliberately pure. It reads no clock, no storage and no
 * nutrition state — the caller passes a context in, which is what keeps the
 * §3.5 guarantee mechanical rather than a matter of discipline.
 */

export type MascotState =
  | 'idle'
  | 'happy'
  | 'celebrating'
  | 'sleepy'
  | 'proud'
  | 'neutral'

import {
  AMBIENT,
  FIRST_LOG,
  LATE_NIGHT,
  POKES,
  REPERTOIRE,
  RETURNING,
  RING_COMPLETE,
  TAUNTS,
  WOKEN,
} from './mascotLines'

/* ── Seeding ──────────────────────────────────────────────────
 * The old picker seeded from today's meal count alone, so the line could only
 * change by eating: the same sentence at breakfast, at dinner and at midnight.
 * Folding the day and the hour in moves it through the day instead.
 */
function hashSeed(value: string): number {
  let n = 0
  for (let i = 0; i < value.length; i++) n = (n * 31 + value.charCodeAt(i)) >>> 0
  return n
}

export type VoiceOccasion = 'returning' | 'ring_complete' | 'first_log' | 'late_night' | 'ambient'

export interface VoiceContext {
  state: MascotState
  /** Local day key, `YYYY-MM-DD`. Keeps a line stable within the day. */
  dayKey: string
  /** Local hour, 0–23. Moves the line through the day. */
  hour: number
  /** Entries logged today. */
  entryCount: number
  /** The most recent log was the first of the day. */
  firstLogOfDay?: boolean
  /** Calendar days since the previous logged day. 2 or more reads as a gap. */
  daysAway?: number
  /** Every required arc of the day ring is closed. */
  ringComplete?: boolean
}

const LATE_NIGHT_UNTIL_HOUR = 5
const AWAY_DAYS = 2

/**
 * Which pool a moment draws from. Most specific wins, and a paused tracker is
 * never given an occasion — `neutral` means the numbers are hidden and Momo
 * should stay quiet and steady rather than celebrating arcs.
 */
export function occasionFor(ctx: VoiceContext): VoiceOccasion {
  if (ctx.state === 'neutral') return 'ambient'
  if ((ctx.daysAway ?? 0) >= AWAY_DAYS) return 'returning'
  if (ctx.ringComplete) return 'ring_complete'
  if (ctx.firstLogOfDay) return 'first_log'
  if (ctx.hour < LATE_NIGHT_UNTIL_HOUR) return 'late_night'
  return 'ambient'
}

function poolFor(occasion: VoiceOccasion, state: MascotState): string[] {
  switch (occasion) {
    case 'returning': return RETURNING
    case 'ring_complete': return RING_COMPLETE
    case 'first_log': return FIRST_LOG
    case 'late_night': return LATE_NIGHT
    case 'ambient': return AMBIENT[state]
  }
}

/**
 * Calendar days between the last day someone logged and today, ignoring today
 * itself. Zero when they logged yesterday or have never logged — a first-time
 * user is not "returning".
 */
export function daysSincePreviousLog(loggedDayKeys: readonly string[], todayKey: string): number {
  const previous = loggedDayKeys.filter(key => key < todayKey).sort().pop()
  if (!previous) return 0

  const day = 86_400_000
  const diff = Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`)
  return Math.max(0, Math.round(diff / day))
}

/**
 * The line for a moment.
 *
 * Pure and deterministic in `(ctx, recent)`, which matters: the web renders
 * this during a render pass, and a picker that varied per call would change
 * the sentence under the reader on any re-render.
 *
 * `recent` is the caller's short memory of what Momo just said. Those lines are
 * skipped so he does not repeat himself back-to-back; if the pool is entirely
 * recent, it falls back to the full pool rather than returning nothing.
 */
export function momoLine(ctx: VoiceContext, recent: readonly string[] = []): string {
  const occasion = occasionFor(ctx)
  const pool = poolFor(occasion, ctx.state)
  const fresh = pool.filter(line => !recent.includes(line))
  const options = fresh.length > 0 ? fresh : pool
  const seed = hashSeed(`${ctx.dayKey}|${ctx.hour}|${ctx.entryCount}|${occasion}|${ctx.state}`)
  return options[seed % options.length]!
}

/**
 * The older positional picker, kept for callers that have only a state and a
 * number to hand. `momoLine` is the one to reach for in new code.
 */
export function ambientLine(state: MascotState, seed = 0): string {
  const options = AMBIENT[state]
  return options[Math.abs(Math.trunc(seed)) % options.length]!
}

/**
 * `count` is the poke number within this session, starting at 1. A sleepy
 * Momo gets woken first, which is worth its own line — after that he joins
 * the escalation like everyone else.
 */
export function pokeLine(state: MascotState, count: number): string {
  const n = Math.max(1, Math.trunc(count))

  if (state === 'sleepy' && n <= WOKEN.length) {
    return WOKEN[n - 1]!
  }

  // Past the end of the ladder he stays on the last, most worn-down line
  // rather than looping back to being pleased to see you.
  return POKES[Math.min(n - 1, POKES.length - 1)]!
}

/* ── The poke repertoire ──────────────────────────────────────
 * Momo does not just say something when prodded — he *does* something, and the
 * action and the line are written as a pair.
 *
 * The pose ladder still escalates by poke number, but the line is now picked
 * from the lines written for that beat rather than welded to it, so the fourth
 * poke of one session is not word-for-word the fourth of the last.
 */
export const POKE_POSES = [
  'poke_wobble',
  'poke_hop',
  'poke_squish',
  'poke_spin',
  'poke_puff',
  'poke_dizzy',
  'poke_tip',
  'poke_hide',
] as const

export type PokePose = (typeof POKE_POSES)[number]

export interface PokeAct {
  pose: PokePose
  line: string
}

/**
 * `n` is the poke number in this session, starting at 1. `variant` shifts which
 * line that beat uses — pass a per-session value so the ladder reads the same
 * but does not recite.
 */
export function pokeAct(n: number, variant = 0): PokeAct {
  const count = Math.max(1, Math.trunc(n))
  const i = Math.min(count, REPERTOIRE.length) - 1
  const beat = REPERTOIRE[i]!
  const v = Math.abs(Math.trunc(variant))
  // Once the escalation has reached its final beat, keep the put-upon pose but
  // rotate the wording. A long tapping session should not freeze on one line.
  const turn = count > REPERTOIRE.length ? count - 1 : i
  return { pose: beat.pose, line: beat.lines[(v + turn) % beat.lines.length]! }
}

/** Every poke line, for the copy-safety test. */
export function pokeLines(): string[] {
  return REPERTOIRE.flatMap(beat => beat.lines)
}

/* ── Volunteer taunts ─────────────────────────────────────────
 * Randomness belongs to the caller's scheduler. This picker stays pure and
 * deterministic so a render or retry cannot silently swap the joke. The pose
 * keys intentionally reuse ambient gestures that both clients already know.
 */
export const TAUNT_POSES = [
  'wave_at_user',
  'look_around',
  'stretch',
  'wander',
  'tiny_dance',
  'happy_hop',
  'ponder',
  'bow',
] as const

export type TauntPose = (typeof TAUNT_POSES)[number]

export interface TauntAct {
  pose: TauntPose
  line: string
}

/** Pick a gesture-matched aside while skipping the caller's recent lines. */
export function tauntAct(
  pose: TauntPose,
  seed = 0,
  recent: readonly string[] = [],
): TauntAct {
  const pool = TAUNTS[pose]
  const fresh = pool.filter(line => !recent.includes(line))
  const options = fresh.length > 0 ? fresh : pool
  const variant = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0

  return { pose, line: options[variant % options.length]! }
}

/** Every volunteer-taunt line, for copy-safety tests and recent-line memory. */
export function tauntLines(): string[] {
  return TAUNT_POSES.flatMap(pose => TAUNTS[pose])
}

/**
 * Every line Momo can utter, for the copy-safety test. Anything added above
 * must be reachable from here or it ships unchecked.
 */
export function allLines(): string[] {
  return [
    ...Object.values(AMBIENT).flat(),
    ...RETURNING,
    ...RING_COMPLETE,
    ...FIRST_LOG,
    ...LATE_NIGHT,
    ...POKES,
    ...WOKEN,
    ...pokeLines(),
    ...tauntLines(),
  ]
}
