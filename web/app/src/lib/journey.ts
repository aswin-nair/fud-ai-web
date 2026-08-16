import type { FoodEntry, GamificationState } from '../types'
import { localDayKey } from './dates'

// ── Journey stages ─────────────────────────────────────────────
export interface JourneyStage {
  stage: number
  name: string
  /** One-word label for the path map */
  short: string
  tagline: string
  companion: string
  terrain: string
  color: string
  minDays: number
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    stage: 1, name: 'First Steps', short: 'Steps', minDays: 0,
    tagline: 'Every journey starts with a single log.',
    companion: '🌱', terrain: '🌾', color: '#6B9FFF',
  },
  {
    stage: 2, name: 'Building the Habit', short: 'Habit', minDays: 7,
    tagline: "You're showing up. That's the whole game.",
    companion: '🌿', terrain: '🌲', color: '#4CD964',
  },
  {
    stage: 3, name: 'Finding Balance', short: 'Balance', minDays: 14,
    tagline: 'Patterns are emerging. Variety is your superpower.',
    companion: '🪴', terrain: '🏡', color: '#FFB347',
  },
  {
    stage: 4, name: 'Steady Habits', short: 'Steady', minDays: 30,
    tagline: 'This is who you are now — a mindful eater.',
    companion: '🌳', terrain: '🏔️', color: '#FF6B9D',
  },
  {
    stage: 5, name: 'The Long Game', short: 'Long Game', minDays: 60,
    tagline: 'Two months in. Your future self thanks you.',
    companion: '🌲', terrain: '🌟', color: '#A78BFA',
  },
  {
    stage: 6, name: 'Wellness Explorer', short: 'Explorer', minDays: 100,
    tagline: "You've turned tracking into a way of life.",
    companion: '✨', terrain: '🌈', color: '#FF7A50',
  },
]

export function getJourneyStage(totalLoggedDays: number): JourneyStage {
  return [...JOURNEY_STAGES].reverse().find(s => totalLoggedDays >= s.minDays) ?? JOURNEY_STAGES[0]
}

export function getNextStage(currentStage: JourneyStage): JourneyStage | null {
  const idx = JOURNEY_STAGES.findIndex(s => s.stage === currentStage.stage)
  return JOURNEY_STAGES[idx + 1] ?? null
}

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
): number {
  if (!entries.length) return 0

  const loggedDays = new Set([
    ...entries.map(e => localDayKey(new Date(e.timestamp))),
    ...freezeUsedDates,
  ])

  const check = new Date()
  check.setHours(0, 0, 0, 0)

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  if (!loggedDays.has(dayKey(check))) {
    check.setDate(check.getDate() - 1)
  }

  let streak = 0
  while (loggedDays.has(dayKey(check))) {
    streak++
    check.setDate(check.getDate() - 1)
  }
  return streak
}

/** Apply freeze for yesterday if: gap exists, streak was active, freeze credit available. */
export function applyFreeze(
  entries: FoodEntry[],
  gamification: GamificationState,
): Pick<GamificationState, 'streakFreezes' | 'freezeUsedDates' | 'freezeEarnedMonth'> {
  let { streakFreezes, freezeUsedDates, freezeEarnedMonth } = gamification

  // Monthly reset
  const currentMonth = new Date().toISOString().slice(0, 7)
  if (currentMonth !== freezeEarnedMonth) {
    streakFreezes = 1
    freezeEarnedMonth = currentMonth
  }

  const loggedDays = new Set(entries.map(e => localDayKey(new Date(e.timestamp))))

  const yesterday = new Date()
  yesterday.setHours(0, 0, 0, 0)
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = localDayKey(yesterday)

  const twoDaysAgo = new Date(yesterday)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)
  const t2Key = localDayKey(twoDaysAgo)

  // Only freeze yesterday if: missed, not already frozen, had a streak going (2d ago logged)
  if (
    !loggedDays.has(yKey) &&
    !freezeUsedDates.includes(yKey) &&
    streakFreezes > 0 &&
    loggedDays.has(t2Key)
  ) {
    streakFreezes--
    freezeUsedDates = [...freezeUsedDates, yKey]
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
  // Milestones
  { id: 'first_bite',  emoji: '🍽️', name: 'First Bite',       desc: 'Log your first meal',          category: 'milestone',    check: (t)               => t >= 1   },
  { id: 'meal_10',     emoji: '🎯', name: 'Getting Started',  desc: '10 meals logged',               category: 'milestone',    check: (t)               => t >= 10  },
  { id: 'meal_50',     emoji: '🏆', name: 'Half Century',     desc: '50 meals logged',               category: 'milestone',    check: (t)               => t >= 50  },
  { id: 'meal_100',    emoji: '💯', name: 'Century',          desc: '100 meals logged',              category: 'milestone',    check: (t)               => t >= 100 },
  // Consistency
  { id: 'streak_3',   emoji: '🔥', name: 'On Fire',           desc: '3-day logging streak',          category: 'consistency',  check: (_t, s)                    => s >= 3   },
  { id: 'streak_7',   emoji: '⚡', name: 'Week Warrior',      desc: '7-day streak',                  category: 'consistency',  check: (_t, s)                    => s >= 7   },
  { id: 'streak_14',  emoji: '🌟', name: 'Fortnight Streak',  desc: '14-day streak',                 category: 'consistency',  check: (_t, s)                    => s >= 14  },
  { id: 'streak_30',  emoji: '💪', name: 'Unstoppable',       desc: '30-day streak',                 category: 'consistency',  check: (_t, s)                    => s >= 30  },
  { id: 'streak_100', emoji: '👑', name: 'Legend',            desc: '100-day streak',                category: 'consistency',  check: (_t, s)                    => s >= 100 },
  { id: 'days_7',     emoji: '📅', name: 'Week Done',         desc: 'Logged on 7 different days',    category: 'consistency',  check: (_t, _s, d)                => d >= 7   },
  { id: 'days_30',    emoji: '📆', name: 'Monthly Logger',    desc: 'Logged on 30 different days',   category: 'consistency',  check: (_t, _s, d)                => d >= 30  },
  // Variety
  { id: 'unique_5',   emoji: '🎨', name: 'Explorer',          desc: '5 unique foods logged',         category: 'variety',      check: (_t, _s, _d, f)            => f >= 5   },
  { id: 'unique_20',  emoji: '🌍', name: 'Adventurous',       desc: '20 unique foods logged',        category: 'variety',      check: (_t, _s, _d, f)            => f >= 20  },
  { id: 'unique_50',  emoji: '🧑‍🍳', name: 'Master Taster',  desc: '50 unique foods logged',        category: 'variety',      check: (_t, _s, _d, f)            => f >= 50  },
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
