import { previousLocalDate, monthOf, type LocalDate } from './calendar'

export interface FreezePlan {
  cover: LocalDate[]
  protectedStreak: number
}

export interface MonthlyFreezeGrant {
  count: number
  earnedMonth: string
}

/**
 * One free freeze per calendar month. A new month restores a single credit;
 * unused credits do not stack.
 */
export function grantMonthlyFreeze(
  currentMonth: string,
  earnedMonth: string,
  currentCount: number,
): MonthlyFreezeGrant {
  if (currentMonth === earnedMonth) {
    return { count: currentCount, earnedMonth }
  }
  return { count: 1, earnedMonth: currentMonth }
}

/**
 * Cover only yesterday, and only when a freeze can extend an existing run.
 * Neutral/pause days may keep the run continuous without increasing the count.
 */
export function planFreeze(
  loggedDates: readonly LocalDate[],
  freezeDates: readonly LocalDate[],
  today: LocalDate,
  freezesAvailable: number,
  extraCoveredDates: readonly LocalDate[] = [],
): FreezePlan {
  const none: FreezePlan = { cover: [], protectedStreak: 0 }
  if (freezesAvailable < 1) return none

  const counted = new Set([...loggedDates, ...freezeDates])
  const covered = new Set([...counted, ...extraCoveredDates])
  const yesterday = previousLocalDate(today)
  if (covered.has(yesterday)) return none

  const dayBefore = previousLocalDate(yesterday)
  if (!covered.has(dayBefore)) return none

  let count = 0
  let cursor = dayBefore
  while (covered.has(cursor)) {
    count += 1
    cursor = previousLocalDate(cursor)
  }

  return { cover: [yesterday], protectedStreak: count + 1 }
}

export function freezeMonthFromDate(today: LocalDate): string {
  return monthOf(today)
}
