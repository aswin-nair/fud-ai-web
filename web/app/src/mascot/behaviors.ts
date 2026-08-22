import type { AnchorId } from './anchors'

export const MOODS = ['neutral', 'sleepy', 'excited', 'proud', 'curious', 'cozy'] as const
export type Mood = (typeof MOODS)[number]

export type Screen = 'today' | 'log' | 'quests' | 'insights' | 'you'

export const BEHAVIOR_IDS = {
  idle_breathe: 0,
  idle_blink: 1,
  celebrate_small: 10,
  celebrate_big: 11,
  sniff_plate: 12,
  point_at_target: 13,
  wave_at_user: 14,
  enter: 16,
  exit: 17,
  poke_wobble: 20,
  poke_hop: 21,
  poke_squish: 22,
  poke_spin: 23,
  poke_puff: 24,
  poke_dizzy: 25,
  poke_tip: 26,
  poke_hide: 27,
} as const

export type BehaviorKey = keyof typeof BEHAVIOR_IDS

export interface BehaviorContext {
  screen: Screen
  mood: Mood
  hour: number
  streak: number
  accountAgeDays: number
  idleSeconds: number
  hasAnchor(id: AnchorId): boolean
}

export interface Behavior {
  key: BehaviorKey
  priority: 0 | 1 | 2 | 3 | 4
  screens?: Screen[]
  anchor?: AnchorId
  durationMs: number
  cooldownMs: number
  weight: number
  when?: (ctx: BehaviorContext) => boolean
}

export const BEHAVIORS: Behavior[] = [
  { key: 'idle_breathe', priority: 4, durationMs: 3000, cooldownMs: 0, weight: 10 },
  { key: 'idle_blink', priority: 4, durationMs: 400, cooldownMs: 2500, weight: 6 },
  {
    key: 'point_at_target',
    priority: 2,
    screens: ['today'],
    anchor: 'fab',
    durationMs: 2400,
    cooldownMs: 45_000,
    weight: 6,
    when: c => c.idleSeconds > 25,
  },
  {
    key: 'wave_at_user',
    priority: 2,
    durationMs: 1800,
    cooldownMs: 600_000,
    weight: 5,
  },
  { key: 'celebrate_small', priority: 1, durationMs: 1400, cooldownMs: 0, weight: 1 },
  { key: 'celebrate_big', priority: 1, durationMs: 2600, cooldownMs: 0, weight: 1 },
  { key: 'enter', priority: 1, durationMs: 700, cooldownMs: 0, weight: 1 },
  { key: 'exit', priority: 1, durationMs: 500, cooldownMs: 0, weight: 1 },
  /* Poke reactions. Weight 0 keeps them out of the ambient lottery — they only
     ever play because a finger asked for them. */
  { key: 'poke_wobble', priority: 0, durationMs: 600, cooldownMs: 0, weight: 0 },
  { key: 'poke_hop',    priority: 0, durationMs: 550, cooldownMs: 0, weight: 0 },
  { key: 'poke_squish', priority: 0, durationMs: 550, cooldownMs: 0, weight: 0 },
  { key: 'poke_spin',   priority: 0, durationMs: 700, cooldownMs: 0, weight: 0 },
  { key: 'poke_puff',   priority: 0, durationMs: 600, cooldownMs: 0, weight: 0 },
  { key: 'poke_dizzy',  priority: 0, durationMs: 900, cooldownMs: 0, weight: 0 },
  { key: 'poke_tip',    priority: 0, durationMs: 800, cooldownMs: 0, weight: 0 },
  { key: 'poke_hide',   priority: 0, durationMs: 850, cooldownMs: 0, weight: 0 },
  { key: 'sniff_plate', priority: 0, screens: ['log'], durationMs: 3000, cooldownMs: 0, weight: 1 },
]

export const BEHAVIOR_BY_KEY = new Map(BEHAVIORS.map(b => [b.key, b]))

export type ActivityLevel = 'lively' | 'calm' | 'off'

const DECAY_BANDS: Array<{ maxAgeDays: number; minMs: number; maxMs: number }> = [
  { maxAgeDays: 3, minMs: 8_000, maxMs: 14_000 },
  { maxAgeDays: 14, minMs: 15_000, maxMs: 25_000 },
  { maxAgeDays: 45, minMs: 25_000, maxMs: 45_000 },
  { maxAgeDays: Infinity, minMs: 45_000, maxMs: 90_000 },
]

const ACTIVITY_MULTIPLIER: Record<Exclude<ActivityLevel, 'off'>, number> = {
  lively: 0.6,
  calm: 1.8,
}

export function nextAmbientDelayMs(
  accountAgeDays: number,
  activity: ActivityLevel,
  rng: () => number = Math.random,
): number {
  if (activity === 'off') return Infinity
  const band = DECAY_BANDS.find(b => accountAgeDays <= b.maxAgeDays)!
  const jittered = band.minMs + rng() * (band.maxMs - band.minMs)
  return Math.round(jittered * ACTIVITY_MULTIPLIER[activity])
}

export function deriveMood(ctx: Omit<BehaviorContext, 'hasAnchor'>): Mood {
  if (ctx.hour >= 22 || ctx.hour < 6) return 'sleepy'
  if (ctx.idleSeconds > 90) return 'cozy'
  if (ctx.streak >= 30) return 'proud'
  if (ctx.screen === 'insights') return 'curious'
  if (ctx.hour >= 6 && ctx.hour < 10) return 'excited'
  return 'neutral'
}

export function screenFromPath(pathname: string): Screen {
  if (pathname.startsWith('/log') || pathname.startsWith('/review')) return 'log'
  if (pathname.startsWith('/journey')) return 'quests'
  if (pathname.startsWith('/progress')) return 'insights'
  if (pathname.startsWith('/settings') || pathname.startsWith('/about') || pathname.startsWith('/coach')) return 'you'
  return 'today'
}
