/** A calendar label in YYYY-MM-DD form, not an instant. */
export type LocalDate = string

const DAY_MS = 86_400_000

function parseCalendarDate(date: LocalDate): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return Number.NaN

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)

  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) return Number.NaN

  return timestamp
}

function formatCalendarDate(timestamp: number): LocalDate {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export function isLocalDate(value: unknown): value is LocalDate {
  return typeof value === 'string' && Number.isFinite(parseCalendarDate(value))
}

/**
 * Calendar arithmetic deliberately uses UTC. The input is a calendar label,
 * so this remains stable across 23-hour and 25-hour daylight-saving days.
 */
export function previousLocalDate(date: LocalDate): LocalDate {
  const timestamp = parseCalendarDate(date)
  if (!Number.isFinite(timestamp)) throw new RangeError(`Invalid local date: ${date}`)
  return formatCalendarDate(timestamp - DAY_MS)
}

export function nextLocalDate(date: LocalDate): LocalDate {
  const timestamp = parseCalendarDate(date)
  if (!Number.isFinite(timestamp)) throw new RangeError(`Invalid local date: ${date}`)
  return formatCalendarDate(timestamp + DAY_MS)
}

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

/**
 * Calendar label for an instant in an explicit IANA zone. Callers that still
 * use the device zone must keep that adapter outside this package.
 */
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

export function localHourInZone(instant: Date, timeZone: string): number {
  if (!isIanaTimeZone(timeZone) || Number.isNaN(instant.getTime())) {
    throw new RangeError('Instant and IANA time zone are required')
  }
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(instant).find(part => part.type === 'hour')?.value
  const value = Number(hour)
  if (!Number.isInteger(value) || value < 0 || value > 23) {
    throw new RangeError('Zoned instant did not produce a local hour')
  }
  return value
}

/** `YYYY-MM` grant window for the monthly streak freeze. */
export function monthOf(date: LocalDate): string {
  if (!isLocalDate(date)) throw new RangeError(`Invalid local date: ${date}`)
  return date.slice(0, 7)
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function localDaysBetween(from: LocalDate, to: LocalDate): number {
  const fromTimestamp = parseCalendarDate(from)
  const toTimestamp = parseCalendarDate(to)
  if (!Number.isFinite(fromTimestamp) || !Number.isFinite(toTimestamp)) {
    throw new RangeError(`Invalid local-date range: ${from} to ${to}`)
  }
  return Math.round((toTimestamp - fromTimestamp) / DAY_MS)
}
