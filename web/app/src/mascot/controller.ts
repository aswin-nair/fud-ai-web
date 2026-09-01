import type { AnchorId } from './anchors'
import {
  BEHAVIORS,
  BEHAVIOR_BY_KEY,
  nextAmbientDelayMs,
  type ActivityLevel,
  type Behavior,
  type BehaviorContext,
  type BehaviorKey,
  type Screen,
} from './behaviors'

export interface MascotHandle {
  react(key: BehaviorKey): void
}

export function pickAmbient(
  ctx: BehaviorContext,
  cooldowns: Map<BehaviorKey, number>,
  now: number,
  rng: () => number = Math.random,
): Behavior | null {
  const eligible = BEHAVIORS.filter((b) => {
    if (b.priority !== 2 && b.priority !== 3) return false
    if (b.screens && !b.screens.includes(ctx.screen)) return false
    if ((cooldowns.get(b.key) ?? 0) > now) return false
    if (b.when && !b.when(ctx)) return false
    if (b.anchor && !ctx.hasAnchor(b.anchor)) return false
    return true
  })
  if (eligible.length === 0) return null
  const top = Math.min(...eligible.map(b => b.priority))
  const pool = eligible.filter(b => b.priority === top)
  let roll = rng() * pool.reduce((sum, b) => sum + b.weight, 0)
  for (const b of pool) {
    roll -= b.weight
    if (roll <= 0) return b
  }
  return pool[pool.length - 1] ?? null
}

export function scheduleDelay(accountAgeDays: number, activity: ActivityLevel, rng?: () => number): number {
  return nextAmbientDelayMs(accountAgeDays, activity, rng)
}

export interface VolunteerTauntContext {
  activity: ActivityLevel
  idleSeconds: number
  elapsedSinceSpeechMs: number
  speechCooldownMs: number
  reducedMotion: boolean
  paused: boolean
  quietScreen: boolean
}

/**
 * Whether Momo may volunteer a joke on this ambient tick.
 *
 * This is deliberately a second, small lottery instead of being tied to the
 * ambient behaviour picker. Priority-two anchored behaviours usually win that
 * picker, which made the unanchored wave/look/stretch branch effectively mute.
 * Pointer and keyboard activity reset `idleSeconds` in the overlay, so a joke
 * cannot interrupt someone who is actively using the app.
 */
export function shouldVolunteerTaunt(
  context: VolunteerTauntContext,
  rng: () => number = Math.random,
): boolean {
  if (
    context.activity === 'off'
    || context.reducedMotion
    || context.paused
    || context.quietScreen
    || context.elapsedSinceSpeechMs < context.speechCooldownMs
  ) return false

  const minimumIdleSeconds = context.activity === 'lively' ? 18 : 36
  if (context.idleSeconds < minimumIdleSeconds) return false

  // The scheduler is already jittered. This extra gate makes the eligible tick
  // feel spontaneous while calm mode stays appreciably quieter.
  const chance = context.activity === 'lively' ? 0.32 : 0.16
  return rng() < chance
}

export function behaviorByKey(key: BehaviorKey): Behavior | undefined {
  return BEHAVIOR_BY_KEY.get(key)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export interface Viewport { width: number; height: number }

/**
 * The viewport, as a value. Passing it in keeps the placement maths pure and
 * testable — this project runs its unit tests in node, with no DOM.
 */
function viewportOr(given?: Viewport): Viewport {
  if (given) return given
  if (typeof window === 'undefined') return { width: 390, height: 844 }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function restPosition(size = 88, viewport?: Viewport): { x: number; y: number } {
  const { width, height } = viewportOr(viewport)
  return {
    x: width - size - 16,
    y: height - size - 108,
  }
}

/**
 * Where to stand in order to look at something.
 *
 * `rect` is the anchor's centre. Standing `size` above that centre put Momo on
 * top of the thing he had walked over to look at, and for anything near the top
 * of the screen the clamp pinned him into the header. So: prefer just above the
 * anchor's top edge, and drop below it when there is no room up there.
 */
export function targetFromRect(
  rect: { x: number; y: number; height?: number },
  size: number,
  viewport?: Viewport,
): { x: number; y: number } {
  const { width, height } = viewportOr(viewport)
  const gap = 10
  const half = (rect.height ?? 0) / 2
  const maxY = height - size - 8
  const above = rect.y - half - size - gap
  const below = rect.y + half + gap

  return {
    x: clamp(rect.x - size / 2, 8, width - size - 8),
    y: clamp(above >= 8 ? above : Math.min(below, maxY), 8, maxY),
  }
}

export function hasVisibleAnchor(
  getRect: (id: AnchorId) => { x: number; y: number } | null,
  id: AnchorId,
): boolean {
  return getRect(id) !== null
}

export function screenQuiet(screen: Screen): boolean {
  return screen === 'insights'
}
