import { previousLocalDate, type LocalDate } from './calendar'

export const DEFAULT_AT_RISK_HOUR = 18

export interface LoggingStreak {
  count: number
  loggedToday: boolean
  atRisk: boolean
}

export interface LoggingStreakInput {
  /** Days with a real log. Duplicate days are harmless. */
  loggedDates: readonly LocalDate[]
  /** Consumed freezes: these bridge a gap and add one counted day. */
  freezeDates?: readonly LocalDate[]
  /** Pause days: these bridge a gap but never increase the count. */
  neutralDates?: readonly LocalDate[]
  today: LocalDate
  localHour?: number
  atRiskHour?: number
}

/**
 * Derive a logging streak from calendar labels. No instants or mutable counters
 * enter this function, so DST and travel cannot silently rewrite history.
 */
export function deriveLoggingStreak(input: LoggingStreakInput): LoggingStreak {
  const logged = new Set(input.loggedDates)
  const counted = new Set([...input.loggedDates, ...(input.freezeDates ?? [])])
  const neutral = new Set(input.neutralDates ?? [])
  const covered = new Set([...counted, ...neutral])
  const loggedToday = logged.has(input.today)

  let cursor = covered.has(input.today) ? input.today : previousLocalDate(input.today)
  let count = 0

  while (covered.has(cursor)) {
    if (counted.has(cursor) && !neutral.has(cursor)) count += 1
    cursor = previousLocalDate(cursor)
  }

  const hour = input.localHour ?? 0
  const atRiskHour = input.atRiskHour ?? DEFAULT_AT_RISK_HOUR

  return {
    count,
    loggedToday,
    atRisk: !loggedToday && hour >= atRiskHour,
  }
}
