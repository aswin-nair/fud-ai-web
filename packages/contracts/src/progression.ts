import { isLocalDate, type LocalDate } from '../../domain/src/calendar.js'
import { deriveLoggingStreak, type LoggingStreak } from '../../domain/src/streak.js'
import { CALENDAR_REQUIRED_TYPES, type AccountEntity } from './entities.js'

export interface DerivedProgression {
  streak: LoggingStreak
  acceptedFoodDays: number
  acceptedFoodEvents: number
}

/**
 * Recompute trusted progression from accepted calendar events. Client XP,
 * level, quest, and badge totals are ignored until those policies are
 * extracted in Phase 6.
 */
export function recomputeDerivedProgression(
  entities: readonly AccountEntity[],
  today: LocalDate,
  localHour = 12,
): DerivedProgression {
  if (!isLocalDate(today)) throw new RangeError(`Invalid local date: ${today}`)
  const foodDays: LocalDate[] = []
  const freezeDates: LocalDate[] = []
  const neutralDates: LocalDate[] = []

  for (const entity of entities) {
    if (entity.deletedAt) continue
    if (entity.entityType === 'food_entry' && entity.localDate) foodDays.push(entity.localDate)
    if (entity.entityType === 'profile' && entity.payload.trackingPaused === true && isLocalDate(today)) {
      neutralDates.push(today)
    }
  }

  const uniqueFoodDays = [...new Set(foodDays)]
  return {
    streak: deriveLoggingStreak({
      loggedDates: uniqueFoodDays,
      freezeDates,
      neutralDates,
      today,
      localHour,
    }),
    acceptedFoodDays: uniqueFoodDays.length,
    acceptedFoodEvents: foodDays.length,
  }
}

export function calendarEntities(entities: readonly AccountEntity[]): AccountEntity[] {
  return entities.filter(entity => CALENDAR_REQUIRED_TYPES.has(entity.entityType))
}
