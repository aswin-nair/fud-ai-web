import {
  isIanaTimeZone,
  isLocalDate,
  localDateInZone,
  type LocalDate,
} from '../../domain/src/calendar.js'

export { isIanaTimeZone, isLocalDate, localDateInZone, type LocalDate }

const DEVICE_ID = /^[A-Za-z0-9._:-]{8,128}$/
const ENTITY_ID = /^[A-Za-z0-9._:-]{1,128}$/

export function isDeviceId(value: unknown): value is string {
  return typeof value === 'string' && DEVICE_ID.test(value)
}

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && ENTITY_ID.test(value)
}

export function parseInstant(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? null : instant
}
