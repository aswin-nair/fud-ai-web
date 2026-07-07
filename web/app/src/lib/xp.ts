import type { FoodEntry, GamificationState, XpEvent } from '../types'
import { localDayKey } from './dates'
import { macroTotals } from './storage'

// ── Level thresholds (cumulative XP required) ─────────────────
export const LEVEL_XP = [0, 100, 250, 500, 850, 1300, 1900, 2700, 3700, 5000]

export const LEVEL_NAMES = [
  '', 'First Steps', 'Curious Explorer', 'Building Habits', 'Finding Balance',
  'Nutrition Aware', 'Steady Logger', 'Consistent Tracker', 'Wellness Enthusiast',
  'Journey Veteran', 'Nutrition Master',
]

export const LEVEL_COMPANIONS = ['', '🌱', '🌿', '🪴', '🌳', '🌲', '🌟', '🏆', '💎', '✨', '🌈']

export function levelFromXp(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1
  }
  return 1
}

export function xpForLevel(level: number): number {
  return LEVEL_XP[Math.min(level - 1, LEVEL_XP.length - 1)] ?? 0
}

export function xpForNextLevel(level: number): number {
  return LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)] ?? LEVEL_XP[LEVEL_XP.length - 1]
}

// ── XP award computation ───────────────────────────────────────
export interface XpAward {
  key: string
  label: string
  xp: number
}

export function computeXpAwards(
  newEntry: FoodEntry,
  existingEntries: FoodEntry[],
  gamification: GamificationState,
): XpAward[] {
  const awards: XpAward[] = []
  const dayKey = localDayKey(new Date(newEntry.timestamp))
  const usedKeys = new Set(gamification.xpEvents.map(e => e.key))

  // Always award for logging a meal
  awards.push({ key: `meal-${newEntry.id}`, label: 'Logged a meal', xp: 15 })

  // Today's entries (before adding new)
  const todayEntries = existingEntries.filter(e => localDayKey(new Date(e.timestamp)) === dayKey)
  const todayCount = todayEntries.length

  // First meal of the day
  if (todayCount === 0 && !usedKeys.has(`first-meal-${dayKey}`)) {
    awards.push({ key: `first-meal-${dayKey}`, label: 'First meal of the day!', xp: 10 })
  }

  // Third meal bonus
  if (todayCount === 2 && !usedKeys.has(`three-meals-${dayKey}`)) {
    awards.push({ key: `three-meals-${dayKey}`, label: 'Three meals tracked!', xp: 20 })
  }

  // Fourth meal bonus
  if (todayCount === 3 && !usedKeys.has(`four-meals-${dayKey}`)) {
    awards.push({ key: `four-meals-${dayKey}`, label: 'Full day logged!', xp: 10 })
  }

  // New food discovery (not logged in last 14 days)
  const twoWeeksAgo = Date.now() - 14 * 86400_000
  const recentNames = new Set(
    existingEntries
      .filter(e => new Date(e.timestamp).getTime() > twoWeeksAgo)
      .map(e => e.name.toLowerCase().trim()),
  )
  if (!recentNames.has(newEntry.name.toLowerCase().trim())) {
    awards.push({ key: `new-food-${newEntry.id}`, label: 'New food discovered!', xp: 20 })
  }

  // Balanced macro day (protein 15-35%, carbs 35-60%, fat 20-40%)
  if (!usedKeys.has(`balanced-${dayKey}`)) {
    const withNew = [...todayEntries, newEntry]
    const t = macroTotals(withNew)
    if (t.calories >= 800) {
      const p = (t.protein * 4) / t.calories
      const c = (t.carbs * 4) / t.calories
      const f = (t.fat * 9) / t.calories
      if (p >= 0.15 && p <= 0.35 && c >= 0.35 && c <= 0.60 && f >= 0.20 && f <= 0.40) {
        awards.push({ key: `balanced-${dayKey}`, label: 'Balanced macros today!', xp: 25 })
      }
    }
  }

  // Filter already-awarded keys
  return awards.filter(a => !usedKeys.has(a.key))
}

export function makeXpEvents(awards: XpAward[]): XpEvent[] {
  return awards.map(a => ({
    id: crypto.randomUUID(),
    key: a.key,
    xp: a.xp,
    label: a.label,
    timestamp: new Date().toISOString(),
  }))
}
