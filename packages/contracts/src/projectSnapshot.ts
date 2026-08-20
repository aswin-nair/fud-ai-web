import {
  isIanaTimeZone,
  localDateInZone,
  parseInstant,
} from './calendarContext.js'
import {
  CONTRACT_VERSION,
  payloadContainsSecret,
  validateAccountEntity,
  type AccountEntity,
  type EntityType,
} from './entities.js'

export const SNAPSHOT_COMPAT_DEVICE = 'snapshot-compat'

const FOOD_SOURCES = new Set(['textInput', 'manual', 'snapFood', 'quickAdd', 'recent'])
const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack', 'other'])

export interface SnapshotProjection {
  timeZone: string
  deviceId?: string
}

export interface ProjectedSnapshot {
  entities: AccountEntity[]
  rejected: number
}

function row(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown, max = 200): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function entity(
  type: EntityType,
  id: string,
  deviceId: string,
  timeZone: string,
  instant: Date,
  localDate: string | null,
  payload: Record<string, unknown>,
): AccountEntity | null {
  const iso = instant.toISOString()
  const record: AccountEntity = {
    contractVersion: CONTRACT_VERSION,
    entityType: type,
    entityId: id,
    deviceId,
    localDate,
    timeZone,
    createdAt: iso,
    updatedAt: iso,
    deletedAt: null,
    recordVersion: 1,
    payload,
  }
  return validateAccountEntity(record).ok ? record : null
}

function projectFood(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value) || !text(value.id, 128) || !text(value.name) || !finite(value.calories)) return null
  const instant = parseInstant(value.timestamp)
  if (!instant) return null
  if (!FOOD_SOURCES.has(String(value.source)) || !MEAL_TYPES.has(String(value.mealType))) return null
  return entity('food_entry', value.id, deviceId, timeZone, instant, localDateInZone(instant, timeZone), {
    name: value.name,
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fat: value.fat,
    source: value.source,
    mealType: value.mealType,
    servingSizeGrams: value.servingSizeGrams,
    emoji: value.emoji,
  })
}

function projectWeight(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value) || !text(value.id, 128) || !text(value.date, 10) || !finite(value.weightKg)) return null
  const instant = parseInstant(`${value.date}T12:00:00.000Z`) ?? new Date(`${value.date}T12:00:00.000Z`)
  if (Number.isNaN(instant.getTime())) return null
  return entity('weight_entry', value.id, deviceId, timeZone, instant, value.date, {
    weightKg: value.weightKg,
  })
}

function projectExercise(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value) || !text(value.id, 128) || !text(value.name) || !finite(value.caloriesBurned)) return null
  const instant = parseInstant(value.timestamp)
  if (!instant) return null
  return entity('exercise_entry', value.id, deviceId, timeZone, instant, localDateInZone(instant, timeZone), {
    name: value.name,
    caloriesBurned: value.caloriesBurned,
    durationMinutes: value.durationMinutes,
    emoji: value.emoji,
  })
}

function projectFavorite(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value) || !text(value.id, 128) || !text(value.name) || !finite(value.calories)) return null
  return entity('favorite_meal', value.id, deviceId, timeZone, new Date('2026-01-01T00:00:00.000Z'), null, {
    name: value.name,
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fat: value.fat,
    mealType: value.mealType,
    emoji: value.emoji,
  })
}

function projectChat(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value) || !text(value.id, 128) || !text(value.role, 16) || typeof value.content !== 'string') {
    return null
  }
  const instant = parseInstant(value.timestamp)
  if (!instant) return null
  return entity('chat_message', value.id, deviceId, timeZone, instant, localDateInZone(instant, timeZone), {
    role: value.role,
    contentLength: value.content.length,
  })
}

function projectProfile(
  value: unknown,
  deviceId: string,
  timeZone: string,
): AccountEntity | null {
  if (!row(value)) return null
  const { birthday, gender, heightCm, weightKg, activityLevel, goal } = value
  if (!text(birthday, 10) || !text(gender, 16) || !finite(heightCm) || !finite(weightKg)) return null
  if (!text(activityLevel, 32) || !text(goal, 16)) return null
  return entity('profile', 'profile', deviceId, timeZone, new Date('2026-01-01T00:00:00.000Z'), null, {
    gender,
    birthday,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    weeklyChangeKg: value.weeklyChangeKg,
    bodyFatPercentage: value.bodyFatPercentage,
    trackingPaused: value.trackingPaused,
  })
}

/**
 * Project a secret-free snapshot into calendar-stable entities. Food and
 * exercise local dates come from the stored instant plus the supplied zone.
 * Weight `date` is already a calendar label and is not reinterpreted.
 */
export function projectSnapshot(
  snapshot: unknown,
  options: SnapshotProjection,
): ProjectedSnapshot {
  if (!row(snapshot)) return { entities: [], rejected: 1 }
  if (!isIanaTimeZone(options.timeZone)) return { entities: [], rejected: 1 }
  const deviceId = options.deviceId ?? SNAPSHOT_COMPAT_DEVICE
  const aiSettings = row(snapshot.aiSettings) ? snapshot.aiSettings : {}
  if (payloadContainsSecret(aiSettings) || payloadContainsSecret(snapshot)) {
    return { entities: [], rejected: 1 }
  }

  const entities: AccountEntity[] = []
  let rejected = 0
  const profile = projectProfile(snapshot.profile, deviceId, options.timeZone)
  if (profile) entities.push(profile)
  else if (snapshot.profile !== undefined) rejected += 1

  const collections: Array<[unknown, (value: unknown) => AccountEntity | null]> = [
    [snapshot.foodEntries, value => projectFood(value, deviceId, options.timeZone)],
    [snapshot.weightEntries, value => projectWeight(value, deviceId, options.timeZone)],
    [snapshot.exerciseEntries, value => projectExercise(value, deviceId, options.timeZone)],
    [snapshot.favoriteMeals, value => projectFavorite(value, deviceId, options.timeZone)],
    [snapshot.chatMessages, value => projectChat(value, deviceId, options.timeZone)],
  ]
  for (const [list, project] of collections) {
    if (list === undefined) continue
    if (!Array.isArray(list)) {
      rejected += 1
      continue
    }
    for (const item of list) {
      const next = project(item)
      if (next) entities.push(next)
      else rejected += 1
    }
  }
  return { entities, rejected }
}
