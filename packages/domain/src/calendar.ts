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

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function localDaysBetween(from: LocalDate, to: LocalDate): number {
  const fromTimestamp = parseCalendarDate(from)
  const toTimestamp = parseCalendarDate(to)
  if (!Number.isFinite(fromTimestamp) || !Number.isFinite(toTimestamp)) {
    throw new RangeError(`Invalid local-date range: ${from} to ${to}`)
  }
  return Math.round((toTimestamp - fromTimestamp) / DAY_MS)
}
