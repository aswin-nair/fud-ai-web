export function formatDayLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  if (sameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

/** Calendar date YYYY-MM-DD in the user's local timezone. */
export function localDayKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function weekStrip(center: Date): Date[] {
  const days: Date[] = []
  for (let i = -3; i <= 3; i++) days.push(addDays(center, i))
  return days
}

export function startOfWeek(date: Date, weekStartsOnMonday = false): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = Sun
  const firstWeekday = weekStartsOnMonday ? 1 : 0
  const daysBack = (day - firstWeekday + 7) % 7
  return addDays(d, -daysBack)
}

export function weekDatesContaining(date: Date, weekStartsOnMonday = false): Date[] {
  const start = startOfWeek(date, weekStartsOnMonday)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function narrowWeekday(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'narrow' })
}

export function formatMacroValue(n: number): string {
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.05) return String(Math.round(n))
  return n.toFixed(1)
}
