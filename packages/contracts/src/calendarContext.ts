import { isLocalDate, type LocalDate } from '../../domain/src/calendar.js'

export { isLocalDate, type LocalDate }

const DEVICE_ID = /^[A-Za-z0-9._:-]{8,128}$/
const ENTITY_ID = /^[A-Za-z0-9._:-]{1,128}$/

export function isIanaTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 3 || value.length > 64) return false
  if (value.includes('..') || value.startsWith('/') || value.endsWith('/')) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date('2026-01-01T00:00:00.000Z'))
    return true
  } catch {
    return false
  }
}

export function isDeviceId(value: unknown): value is string {
  return typeof value === 'string' && DEVICE_ID.test(value)
}

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && ENTITY_ID.test(value)
}

export function localDateInZone(instant: Date, timeZone: string): LocalDate {
  if (!isIanaTimeZone(timeZone) || Number.isNaN(instant.getTime())) {
    throw new RangeError('Instant and IANA time zone are required')
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  const date = `${year}-${month}-${day}`
  if (!isLocalDate(date)) throw new RangeError('Zoned instant did not produce a local date')
  return date
}

export function parseInstant(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null
  const instant = new Date(value)
  return Number.isNaN(instant.getTime()) ? null : instant
}
