import {
  WEB_LEVEL_XP,
  eligibleMealXpAwards,
  levelFromXp as sharedLevelFromXp,
  xpForLevel as sharedXpForLevel,
  xpForNextLevel as sharedXpForNextLevel,
  type XpAward as SharedXpAward,
} from '@fud-ai/domain/xp'
import type { FoodEntry, GamificationState, XpEvent } from '../types'
import { localDayKey } from './dates'

export const LEVEL_XP = [...WEB_LEVEL_XP]

export const LEVEL_NAMES = [
  '', 'First Steps', 'Curious Explorer', 'Building Habits', 'Finding Balance',
  'Nutrition Aware', 'Steady Logger', 'Consistent Tracker', 'Wellness Enthusiast',
  'Journey Veteran', 'Nutrition Master',
]

export const LEVEL_COMPANIONS = ['', '🌱', '🌿', '🪴', '🌳', '🌲', '🌟', '🏆', '💎', '✨', '🌈']

export function levelFromXp(xp: number): number {
  return sharedLevelFromXp(xp, LEVEL_XP)
}

export function xpForLevel(level: number): number {
  return sharedXpForLevel(level, LEVEL_XP)
}

export function xpForNextLevel(level: number): number {
  return sharedXpForNextLevel(level, LEVEL_XP)
}

export type XpAward = SharedXpAward

export function computeXpAwards(
  newEntry: FoodEntry,
  existingEntries: FoodEntry[],
  gamification: GamificationState,
): XpAward[] {
  const dayKey = localDayKey(new Date(newEntry.timestamp))
  const usedKeys = new Set([
    ...gamification.awardedKeys,
    ...gamification.xpEvents.map(event => event.key),
  ])
  const todayEntries = existingEntries.filter(entry => localDayKey(new Date(entry.timestamp)) === dayKey)
  const twoWeeksAgo = Date.now() - 14 * 86400_000
  const recentFoodNames = existingEntries
    .filter(entry => new Date(entry.timestamp).getTime() > twoWeeksAgo)
    .map(entry => entry.name)

  return eligibleMealXpAwards({
    entryId: newEntry.id,
    entryName: newEntry.name,
    dayKey,
    existingSameDayCount: todayEntries.length,
    recentFoodNames,
    usedKeys,
  })
}

export function makeXpEvents(awards: XpAward[], timestamp = new Date().toISOString()): XpEvent[] {
  return awards.map(award => ({
    id: crypto.randomUUID(),
    key: award.key,
    xp: award.xp,
    label: award.label,
    timestamp,
  }))
}
