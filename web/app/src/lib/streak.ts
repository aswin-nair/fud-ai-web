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

export interface Badge {
  id: string
  emoji: string
  name: string
  desc: string
  unlocked: boolean
}

export function getBadges(entries: FoodEntry[], streak: number): Badge[] {
  const total = entries.length
  const days = getTotalLoggedDays(entries)

  return [
    { id: 'first_bite',   emoji: '🍽️', name: 'First Bite',      desc: 'Log your first meal',       unlocked: total >= 1   },
    { id: 'on_fire',      emoji: '🔥', name: 'On Fire',          desc: '3-day logging streak',       unlocked: streak >= 3  },
    { id: 'week_warrior', emoji: '⚡', name: 'Week Warrior',     desc: '7-day streak',               unlocked: streak >= 7  },
    { id: 'consistent',   emoji: '🏆', name: 'Consistent',       desc: '50 meals logged',            unlocked: total >= 50  },
    { id: 'century',      emoji: '💯', name: 'Century',          desc: '100 meals logged',           unlocked: total >= 100 },
    { id: 'week_done',    emoji: '📅', name: 'Week Done',        desc: 'Log on 7 different days',    unlocked: days >= 7    },
    { id: 'monthly',      emoji: '📆', name: 'Monthly Master',   desc: 'Log on 30 different days',   unlocked: days >= 30   },
    { id: 'unstoppable',  emoji: '💪', name: 'Unstoppable',      desc: '30-day streak',              unlocked: streak >= 30 },
    { id: 'legend',       emoji: '👑', name: 'Legend',           desc: '100-day streak',             unlocked: streak >= 100},
  ]
}

const STORAGE_KEY = 'fud-seen-badges'

export function getSeenBadgeIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function markBadgesSeen(ids: string[]) {
  const seen = getSeenBadgeIds()
  ids.forEach(id => seen.add(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
}
