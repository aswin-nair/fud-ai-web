/** A calendar label in YYYY-MM-DD form, not an instant. */
export type LocalDate = string

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string') return false
  const match = DAY.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
}

/** Calendar date YYYY-MM-DD in the device's current local timezone. */
export function localDayKey(date: Date | string): LocalDate {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function stampLocalDate(timestamp: string, fallback = new Date()): LocalDate {
  const parsed = new Date(timestamp)
  return localDayKey(Number.isFinite(parsed.getTime()) ? parsed : fallback)
}

/**
 * Prefer the day written at log time. Fall back to deriving from the
 * timestamp so older records still group without a migration rewrite.
 */
export function entryDayKey(entry: { timestamp: string; localDate?: string }): LocalDate {
  return isLocalDate(entry.localDate) ? entry.localDate : localDayKey(entry.timestamp)
}
