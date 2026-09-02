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

  const minimumIdleSeconds = context.activity === 'lively' ? 12 : 30
  if (context.idleSeconds < minimumIdleSeconds) return false

  // The scheduler is already jittered. This extra gate makes the eligible tick
  // feel spontaneous while calm mode stays appreciably quieter.
  const chance = context.activity === 'lively' ? 0.45 : 0.22
  return rng() < chance
}

export function behaviorByKey(key: BehaviorKey): Behavior | undefined {
  return BEHAVIOR_BY_KEY.get(key)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export interface Viewport { width: number; height: number }
export interface Point { x: number; y: number }

/**
 * The viewport, as a value. Passing it in keeps the placement maths pure and
 * testable — this project runs its unit tests in node, with no DOM.
 */
function viewportOr(given?: Viewport): Viewport {
  if (given) return given
  if (typeof window === 'undefined') return { width: 390, height: 844 }
  return { width: window.innerWidth, height: window.innerHeight }
}

const APP_STAGE_MAX_WIDTH = 480
const AUTH_CARD_MAX_WIDTH = 420

function horizontalBounds(width: number, size: number, inset: number): { min: number; max: number } {
  const stageWidth = Math.min(width, APP_STAGE_MAX_WIDTH)
  const stageLeft = (width - stageWidth) / 2
  const viewportMax = Math.max(0, width - size)
  const min = clamp(stageLeft + inset, 0, viewportMax)
  const max = clamp(stageLeft + stageWidth - size - inset, min, viewportMax)
  return { min, max }
}

export function restPosition(size = 88, viewport?: Viewport): { x: number; y: number } {
  const { width, height } = viewportOr(viewport)
  const horizontal = horizontalBounds(width, size, 16)
  return {
    x: horizontal.max,
    y: height - size - 108,
  }
}

/**
 * Keep Momo clear of the authentication form. Wide screens have room beside
 * the card; compact screens use its quiet top-right corner instead of parking
 * over the password and submit controls.
 */
export function authPosition(size = 88, viewport?: Viewport): Point {
  const { width, height } = viewportOr(viewport)
  const viewportMaxX = Math.max(0, width - size)
  const viewportMaxY = Math.max(0, height - size)
  const cardWidth = Math.min(AUTH_CARD_MAX_WIDTH, Math.max(0, width - 32))
  const cardRight = (width + cardWidth) / 2
  const hasSideLane = width >= 900

  return {
    x: hasSideLane
      ? clamp(cardRight + 24, 8, Math.max(8, viewportMaxX - 8))
      : clamp(width - size - 20, 8, Math.max(8, viewportMaxX - 8)),
    y: hasSideLane
      ? clamp(Math.round(height * 0.34), 24, Math.max(24, viewportMaxY - 24))
      : clamp(18, 0, viewportMaxY),
  }
}

/**
 * A safe place for Momo to wander to without sitting in the app header or the
 * bottom navigation. A nearby random roll is mirrored across the stage so a
 * "walk" always covers enough distance to read as movement.
 */
export function roamPosition(
  size = 88,
  viewport?: Viewport,
  current?: Point,
  rng: () => number = Math.random,
): Point {
  const { width, height } = viewportOr(viewport)
  const viewportMaxY = Math.max(0, height - size)
  const horizontal = horizontalBounds(width, size, 12)
  const minX = horizontal.min
  const maxX = horizontal.max
  const minY = Math.min(104, viewportMaxY)
  const maxY = Math.max(minY, Math.min(viewportMaxY, height - size - 112))
  const unit = () => {
    const value = rng()
    return clamp(Number.isFinite(value) ? value : 0.5, 0, 1)
  }

  // Roam along the two edge lanes. Crossing the centre is great while walking;
  // stopping on top of the screen's primary action is not.
  const laneDepth = Math.min(36, Math.max(0, (maxX - minX) * 0.14))
  const onLeft = unit() < 0.5
  const edgeOffset = unit() * laneDepth
  let next = {
    x: Math.round(onLeft ? minX + edgeOffset : maxX - edgeOffset),
    y: Math.round(minY + unit() * (maxY - minY)),
  }

  if (current) {
    const stageWidth = maxX - minX
    const stageHeight = maxY - minY
    const minimumTravel = Math.min(140, Math.max(48, Math.max(stageWidth, stageHeight) * 0.3))
    if (Math.hypot(next.x - current.x, next.y - current.y) < minimumTravel) {
      next = {
        x: current.x <= (minX + maxX) / 2 ? maxX : minX,
        y: current.y <= (minY + maxY) / 2 ? maxY : minY,
      }
    }
  }

  return next
}

/** Distance-scaled travel keeps a short sidestep quick and a cross-screen walk legible. */
export function travelDurationMs(from: Point, to: Point, reducedMotion = false): number {
  if (reducedMotion) return 0
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  if (distance < 8) return 0
  return Math.round(clamp(distance * 6.5, 650, 2200))
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
