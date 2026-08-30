import { deriveLoggingStreak } from '@fud-ai/domain/streak'
import { entryDayKey, localDayKey } from '@fud-ai/product'
import type { FoodEntry, GamificationState } from './types'

export function loggingStreak(entries: FoodEntry[], gamification: GamificationState, now = new Date()): number {
  if (!entries.length) return 0
  return deriveLoggingStreak({
    loggedDates: entries.map(entryDayKey),
    freezeDates: gamification.freezeUsedDates,
    neutralDates: gamification.pauseProtectedDates,
    today: localDayKey(now),
    localHour: now.getHours(),
  }).count
}

export function entriesForDay(entries: FoodEntry[], date: Date): FoodEntry[] {
  const key = localDayKey(date)
  return entries.filter(entry => entryDayKey(entry) === key).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function macroTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
