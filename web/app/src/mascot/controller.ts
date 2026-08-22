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

export function behaviorByKey(key: BehaviorKey): Behavior | undefined {
  return BEHAVIOR_BY_KEY.get(key)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function restPosition(size = 88): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 16, y: 16 }
  return {
    x: window.innerWidth - size - 16,
    y: window.innerHeight - size - 108,
  }
}

export function targetFromRect(
  rect: { x: number; y: number },
  size: number,
): { x: number; y: number } {
  return {
    x: clamp(rect.x - size / 2, 8, window.innerWidth - size - 8),
    y: clamp(rect.y - size, 8, window.innerHeight - size - 8),
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
