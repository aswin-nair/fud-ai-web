/**
 * Logging rewards attach to actions and consistency, never food outcomes.
 * Legacy currency and quest fields stay in stored state only for migration.
 */

import type { FoodEntry, GamificationState, XpEvent } from '../types'
import { localDayKey } from './dates'
import { levelFromXp } from './xp'

export const ENAMEL_XP = {
  PHOTO: 15,
  MANUAL: 10,
  FIRST_OF_DAY: 5,
  THREE_MAINS: 20,
  WATER: 2,
  NOTE: 5,
} as const

export const ENAMEL_CAPS = {
  WATER: 8,
  NOTES: 3,
  FREEZES: 2,
} as const

export const FREE_FREEZE_STREAK = 7

export type LogMethod = 'manual' | 'photo' | 'repeat' | 'other'

const MAIN_SLOTS = ['breakfast', 'lunch', 'dinner'] as const

export const COSMETICS = [
  { id: 'bow', name: 'Bow', unlockStreak: 0 },
  { id: 'scarf', name: 'Scarf', unlockStreak: 3 },
  { id: 'chef-hat', name: 'Chef hat', unlockStreak: 7 },
  { id: 'apron', name: 'Apron', unlockStreak: 14 },
  { id: 'specs', name: 'Specs', unlockStreak: 30 },
  { id: 'medal', name: 'Logging medal', unlockStreak: 60 },
] as const

export type CosmeticId = (typeof COSMETICS)[number]['id']

export function methodOf(entry: Pick<FoodEntry, 'source'>): LogMethod {
  if (entry.source === 'snapFood') return 'photo'
  if (entry.source === 'recent' || entry.source === 'quickAdd') return 'repeat'
  if (entry.source === 'manual' || entry.source === 'textInput') return 'manual'
  return 'other'
}

export function ticketNumber(entries: FoodEntry[]): number {
  return new Set(entries.map(entry => localDayKey(entry.timestamp))).size
}

function pushXp(
  events: XpEvent[],
  awarded: Set<string>,
  key: string,
  xp: number,
  label: string,
  timestamp: string,
): number {
  if (awarded.has(key) || xp <= 0) return 0
  awarded.add(key)
  events.unshift({ id: crypto.randomUUID(), key, xp, label, timestamp })
  return xp
}

export function applyEnamelLogAwards(
  gamification: GamificationState,
  entry: FoodEntry,
  existing: FoodEntry[],
): GamificationState {
  const date = localDayKey(entry.timestamp)
  const timestamp = new Date().toISOString()
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  let xp = 0
  const method = methodOf(entry)

  if (method === 'photo') {
    xp += pushXp(events, awarded, `enamel-photo-${entry.id}`, ENAMEL_XP.PHOTO, 'Photo log', timestamp)
  } else if (method === 'manual') {
    xp += pushXp(events, awarded, `enamel-manual-${entry.id}`, ENAMEL_XP.MANUAL, 'Logged a meal', timestamp)
  }

  const sameDayBefore = existing.filter(item => localDayKey(item.timestamp) === date)
  if (sameDayBefore.length === 0) {
    xp += pushXp(events, awarded, `enamel-first-${date}`, ENAMEL_XP.FIRST_OF_DAY, 'First log of the day', timestamp)
  }

  const slots = new Set([...sameDayBefore, entry].map(item => item.mealType))
  if (MAIN_SLOTS.every(slot => slots.has(slot))) {
    xp += pushXp(events, awarded, `enamel-mains-${date}`, ENAMEL_XP.THREE_MAINS, 'Three mains logged', timestamp)
  }

  const nextXp = gamification.xp + xp
  return {
    ...gamification,
    xp: nextXp,
    level: levelFromXp(nextXp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
}

export function applyWaterChange(
  gamification: GamificationState,
  date: string,
  glasses: number,
): GamificationState {
  const nextCount = Math.max(0, Math.min(ENAMEL_CAPS.WATER, Math.round(glasses)))
  const prev = Math.max(0, Math.min(ENAMEL_CAPS.WATER, gamification.waterByDate[date] ?? 0))
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  const timestamp = new Date().toISOString()
  let xp = 0

  if (nextCount > prev) {
    for (let i = prev + 1; i <= nextCount; i++) {
      xp += pushXp(events, awarded, `enamel-water-${date}-${i}`, ENAMEL_XP.WATER, 'Water logged', timestamp)
    }
  }

  const nextXp = gamification.xp + xp
  return {
    ...gamification,
    waterByDate: { ...gamification.waterByDate, [date]: nextCount },
    xp: nextXp,
    level: levelFromXp(nextXp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
}

export function applyNote(gamification: GamificationState, date: string): GamificationState {
  const prev = gamification.notesByDate[date] ?? 0
  if (prev >= ENAMEL_CAPS.NOTES) return gamification
  const nextCount = prev + 1
  const awarded = new Set(gamification.awardedKeys)
  const events = [...gamification.xpEvents]
  const xp = pushXp(
    events,
    awarded,
    `enamel-note-${date}-${nextCount}`,
    ENAMEL_XP.NOTE,
    'Kitchen note',
    new Date().toISOString(),
  )
  const nextXp = gamification.xp + xp
  return {
    ...gamification,
    notesByDate: { ...gamification.notesByDate, [date]: nextCount },
    xp: nextXp,
    level: levelFromXp(nextXp),
    xpEvents: events.slice(0, 50),
    awardedKeys: [...awarded],
  }
}

export function grantFreeFreezeAtStreak(gamification: GamificationState, streak: number): GamificationState {
  if (streak < FREE_FREEZE_STREAK) return gamification
  if (gamification.awardedKeys.includes('enamel-free-freeze-7')) return gamification
  return {
    ...gamification,
    streakFreezes: Math.min(ENAMEL_CAPS.FREEZES, gamification.streakFreezes + 1),
    awardedKeys: [...gamification.awardedKeys, 'enamel-free-freeze-7'],
  }
}

export function markBrokenIfNeeded(
  gamification: GamificationState,
  previousStreak: number,
  nextStreak: number,
  today: string,
): GamificationState {
  if (nextStreak === 0 && previousStreak > 0 && !gamification.brokenOn) {
    return { ...gamification, brokenOn: today, brokenFrom: previousStreak }
  }
  if (nextStreak > 0) return { ...gamification, brokenOn: null, brokenFrom: 0 }
  return gamification
}

export function equipCosmetic(
  gamification: GamificationState,
  id: string,
  streak: number,
): GamificationState | null {
  const item = COSMETICS.find(cosmetic => cosmetic.id === id)
  const owned = gamification.ownedCosmeticIds.includes(id)
  if (!item || (!owned && streak < item.unlockStreak)) return null
  return {
    ...gamification,
    ownedCosmeticIds: owned
      ? gamification.ownedCosmeticIds
      : [...gamification.ownedCosmeticIds, id],
    equippedCosmeticId: gamification.equippedCosmeticId === id ? null : id,
  }
}
