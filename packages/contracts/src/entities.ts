import {
  isDeviceId,
  isEntityId,
  isIanaTimeZone,
  isLocalDate,
  parseInstant,
  type LocalDate,
} from './calendarContext.js'

export const CONTRACT_VERSION = 1 as const

export const ENTITY_TYPES = [
  'profile',
  'food_entry',
  'weight_entry',
  'exercise_entry',
  'favorite_meal',
  'chat_message',
] as const

export type EntityType = (typeof ENTITY_TYPES)[number]

export const CALENDAR_REQUIRED_TYPES = new Set<EntityType>([
  'food_entry',
  'weight_entry',
  'exercise_entry',
  'chat_message',
])

export const SECRET_PAYLOAD_KEYS = [
  'apiKey',
  'password',
  'password_hash',
  'password_salt',
  'token',
  'refreshToken',
  'refresh_token',
] as const

export const MAX_ENTITY_PAYLOAD_BYTES = 16_384

export interface CalendarContext {
  localDate: LocalDate | null
  timeZone: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  recordVersion: number
}

export interface AccountEntity extends CalendarContext {
  contractVersion: typeof CONTRACT_VERSION
  entityType: EntityType
  entityId: string
  deviceId: string
  payload: Record<string, unknown>
}

export interface EntityTombstone {
  contractVersion: typeof CONTRACT_VERSION
  entityType: EntityType
  entityId: string
  deviceId: string
  deletedAt: string
  recordVersion: number
}

export type ContractValidation =
  | { ok: true }
  | { ok: false; error: string }

function row(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isEntityType(value: unknown): value is EntityType {
  return typeof value === 'string' && (ENTITY_TYPES as readonly string[]).includes(value)
}

export function payloadContainsSecret(payload: Record<string, unknown>): boolean {
  return SECRET_PAYLOAD_KEYS.some((key) => {
    const value = payload[key]
    return typeof value === 'string' ? value.trim().length > 0 : value != null
  })
}

export function validateAccountEntity(value: unknown): ContractValidation {
  if (!row(value)) return { ok: false, error: 'Entity must be an object' }
  if (value.contractVersion !== CONTRACT_VERSION) {
    return { ok: false, error: 'Unsupported contract version' }
  }
  if (!isEntityType(value.entityType)) return { ok: false, error: 'Unknown entity type' }
  if (!isEntityId(value.entityId)) return { ok: false, error: 'Invalid entity id' }
  if (!isDeviceId(value.deviceId)) return { ok: false, error: 'Invalid device id' }
  if (!isIanaTimeZone(value.timeZone)) return { ok: false, error: 'Invalid IANA time zone' }
  if (!parseInstant(value.createdAt) || !parseInstant(value.updatedAt)) {
    return { ok: false, error: 'Entity timestamps must be instants' }
  }
  if (value.deletedAt !== null && !parseInstant(value.deletedAt)) {
    return { ok: false, error: 'Deletion timestamp must be an instant or null' }
  }
  if (!Number.isSafeInteger(value.recordVersion) || (value.recordVersion as number) < 1) {
    return { ok: false, error: 'Record version must be a positive integer' }
  }
  if (!row(value.payload)) return { ok: false, error: 'Entity payload must be an object' }
  if (payloadContainsSecret(value.payload)) {
    return { ok: false, error: 'Entity payload must not contain secrets' }
  }
  const bytes = new TextEncoder().encode(JSON.stringify(value.payload)).byteLength
  if (bytes > MAX_ENTITY_PAYLOAD_BYTES) return { ok: false, error: 'Entity payload is too large' }
  if (CALENDAR_REQUIRED_TYPES.has(value.entityType)) {
    if (!isLocalDate(value.localDate)) {
      return { ok: false, error: 'Calendar-bearing entities require an explicit local date' }
    }
  } else if (value.localDate !== null && !isLocalDate(value.localDate)) {
    return { ok: false, error: 'Optional local date must be a calendar label' }
  }
  return { ok: true }
}

export function validateTombstone(value: unknown): ContractValidation {
  if (!row(value)) return { ok: false, error: 'Tombstone must be an object' }
  if (value.contractVersion !== CONTRACT_VERSION) {
    return { ok: false, error: 'Unsupported contract version' }
  }
  if (!isEntityType(value.entityType)) return { ok: false, error: 'Unknown entity type' }
  if (!isEntityId(value.entityId)) return { ok: false, error: 'Invalid entity id' }
  if (!isDeviceId(value.deviceId)) return { ok: false, error: 'Invalid device id' }
  if (!parseInstant(value.deletedAt)) return { ok: false, error: 'Tombstone needs a deletion instant' }
  if (!Number.isSafeInteger(value.recordVersion) || (value.recordVersion as number) < 1) {
    return { ok: false, error: 'Record version must be a positive integer' }
  }
  return { ok: true }
}
