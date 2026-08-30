import { grantMonthlyFreeze, planFreeze } from '@fud-ai/domain/freezes'
import { deriveLoggingStreak } from '@fud-ai/domain/streak'
import type { FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'

export function getTotalLoggedDays(entries: FoodEntry[]): number {
  return new Set(entries.map(e => localDayKey(new Date(e.timestamp)))).size
}

export interface MonthConsistency {
  /** Days this month with at least one entry. */
  logged: number
  /** Days of the month that have actually happened yet. */
  elapsed: number
  daysInMonth: number
  /** Whether each day of the month was logged, indexed from the 1st. */
  days: boolean[]
}

/**
 * §9.3 makes this the headline metric rather than calories or weight trend.
 * What gets shown is what gets optimised, and consistency is the behaviour
 * worth optimising — the denominator is days elapsed, not days in the month,
 * so the number never looks like a failure halfway through.
 */
export function getMonthConsistency(
  entries: FoodEntry[],
  ref: Date = new Date(),
): MonthConsistency {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const loggedKeys = new Set(entries.map(e => localDayKey(new Date(e.timestamp))))
  const isCurrentMonth =
    ref.getFullYear() === new Date().getFullYear() && ref.getMonth() === new Date().getMonth()
  const elapsed = isCurrentMonth ? ref.getDate() : daysInMonth

  const days: boolean[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(loggedKeys.has(localDayKey(new Date(year, month, day))))
  }

  return {
    logged: days.slice(0, elapsed).filter(Boolean).length,
    elapsed,
    daysInMonth,
    days,
  }
}

// ── Streak with freeze support ─────────────────────────────────
export function getStreakWithFreezes(
  entries: FoodEntry[],
  freezeUsedDates: string[],
  pauseProtectedDates: string[] = [],
): number {
  if (!entries.length) return 0

  return deriveLoggingStreak({
    loggedDates: entries.map(e => localDayKey(new Date(e.timestamp))),
    freezeDates: freezeUsedDates,
    neutralDates: pauseProtectedDates,
    today: localDayKey(new Date()),
    localHour: new Date().getHours(),
  }).count
}

/** Apply freeze for yesterday if: gap exists, streak was active, freeze credit available. */
export function applyFreeze(
  entries: FoodEntry[],
  gamification: GamificationState,
): Pick<GamificationState, 'streakFreezes' | 'freezeUsedDates' | 'freezeEarnedMonth'> {
  let { streakFreezes, freezeUsedDates, freezeEarnedMonth } = gamification
  const today = localDayKey(new Date())
  const grant = grantMonthlyFreeze(today.slice(0, 7), freezeEarnedMonth, streakFreezes)
  streakFreezes = grant.count
  freezeEarnedMonth = grant.earnedMonth

  const plan = planFreeze(
    entries.map(entry => localDayKey(new Date(entry.timestamp))),
    freezeUsedDates,
    today,
    streakFreezes,
    gamification.pauseProtectedDates,
  )
  const covered = plan.cover[0]
  if (covered) {
    streakFreezes -= 1
    freezeUsedDates = [...freezeUsedDates, covered]
  }

  return { streakFreezes, freezeUsedDates, freezeEarnedMonth }
}

// ── Badges ─────────────────────────────────────────────────────
export type BadgeCategory = 'milestone' | 'consistency' | 'variety'

export interface JourneyBadge {
  id: string
  emoji: string
  name: string
  desc: string
  category: BadgeCategory
  unlocked: boolean
}

function uniqueFoodCount(entries: FoodEntry[]): number {
  return new Set(entries.map(e => e.name.toLowerCase().trim())).size
}

const BADGE_DEFS: Array<Omit<JourneyBadge, 'unlocked'> & {
  check: (total: number, streak: number, days: number, foods: number) => boolean
}> = [
  { id: 'first_bite', emoji: '🍽️', name: 'First Bite', desc: 'Log your first meal', category: 'milestone', check: (t) => t >= 1 },
  { id: 'meal_50', emoji: '🏆', name: 'Half Century', desc: '50 meals logged', category: 'milestone', check: (t) => t >= 50 },
  { id: 'streak_7', emoji: '⚡', name: 'Seven-Day Rhythm', desc: '7-day logging streak', category: 'consistency', check: (_t, s) => s >= 7 },
  { id: 'streak_30', emoji: '💪', name: 'Steady Month', desc: '30-day logging streak', category: 'consistency', check: (_t, s) => s >= 30 },
  { id: 'unique_20', emoji: '🌍', name: 'Food Explorer', desc: '20 distinct foods logged', category: 'variety', check: (_t, _s, _d, f) => f >= 20 },
  { id: 'unique_50', emoji: '🧑‍🍳', name: 'Food Vocabulary', desc: '50 distinct foods logged', category: 'variety', check: (_t, _s, _d, f) => f >= 50 },
]

export function getAllBadges(
  entries: FoodEntry[],
  streak: number,
): JourneyBadge[] {
  const total = entries.length
  const days = getTotalLoggedDays(entries)
  const foods = uniqueFoodCount(entries)
  return BADGE_DEFS.map(({ check, ...def }) => ({
    ...def,
    unlocked: check(total, streak, days, foods),
  }))
}

export const BADGE_CATEGORIES: Array<{ key: BadgeCategory; label: string; emoji: string }> = [
  { key: 'milestone',   label: 'Milestones',    emoji: '🎯' },
  { key: 'consistency', label: 'Consistency',   emoji: '🔥' },
  { key: 'variety',     label: 'Variety',       emoji: '🌍' },
]

export interface BreakfastComparison {
  recent: number
  best: number
  days: 7
}

function dayOffset(day: Date, offset: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset, 12)
}

export function getBreakfastComparison(
  entries: FoodEntry[],
  ref: Date = new Date(),
): BreakfastComparison {
  const breakfastDays = new Set(
    entries
      .filter(entry => entry.mealType === 'breakfast')
      .map(entry => localDayKey(entry.timestamp)),
  )
  const countEndingOn = (end: Date) => {
    let count = 0
    for (let offset = -6; offset <= 0; offset++) {
      if (breakfastDays.has(localDayKey(dayOffset(end, offset)))) count += 1
    }
    return count
  }
  const candidates = [ref, ...[...breakfastDays].map(day => new Date(`${day}T12:00:00`))]
  return {
    recent: countEndingOn(ref),
    best: candidates.reduce((best, day) => Math.max(best, countEndingOn(day)), 0),
    days: 7,
  }
}
