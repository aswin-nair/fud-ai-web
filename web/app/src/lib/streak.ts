import type { FoodEntry } from '../types'

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function getStreak(entries: FoodEntry[]): number {
  if (!entries.length) return 0

  const loggedDays = new Set(entries.map(e => toDayKey(new Date(e.timestamp))))

  const check = new Date()
  check.setHours(0, 0, 0, 0)

  // If didn't log today, start checking from yesterday
  if (!loggedDays.has(toDayKey(check))) {
    check.setDate(check.getDate() - 1)
  }

  let streak = 0
  while (loggedDays.has(toDayKey(check))) {
    streak++
    check.setDate(check.getDate() - 1)
  }

  return streak
}

export function getTotalLoggedDays(entries: FoodEntry[]): number {
  return new Set(entries.map(e => toDayKey(new Date(e.timestamp)))).size
}
