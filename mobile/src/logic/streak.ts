import { type LocalDate } from '@/logic/dates';
import {
  DEFAULT_AT_RISK_HOUR,
  deriveLoggingStreak,
  type LoggingStreak,
} from '@fud-ai/domain/streak';

/** The hour after which an unlogged day is worth surfacing. See §2.3. */
export const AT_RISK_HOUR = DEFAULT_AT_RISK_HOUR;

export type Streak = LoggingStreak;

/**
 * Derived on every read, never stored. A stored counter drifts the moment a
 * write fails, a device clock jumps, or the user crosses a timezone; a
 * derivation from the entries table is always correct.
 *
 * `localHour` is a parameter rather than read from the clock so the at-risk
 * window is testable and so the caller resolves it in the profile's timezone
 * rather than the device's.
 */
export function deriveStreak(
  loggedDates: LocalDate[],
  freezeDates: LocalDate[],
  todayLocal: LocalDate,
  localHour: number,
  neutralDates: LocalDate[] = [],
): Streak {
  return deriveLoggingStreak({
    loggedDates,
    freezeDates,
    neutralDates,
    today: todayLocal,
    localHour,
    atRiskHour: AT_RISK_HOUR,
  });
}
