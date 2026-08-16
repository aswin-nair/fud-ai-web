import { localDayKey } from './dates'
import { track } from './analytics'

/**
 * Two scheduled notifications, hard-capped. Per §2.6 / Phase 8.
 * Copy never mentions calories, weight, or how much someone ate.
 */

const LOG_KEY = 'fud-notify-log'
const MAX_PER_DAY = 2

type NotifyKind = 'routine' | 'save' | 'freeze'

type NotifyLog = { date: string; kinds: NotifyKind[] }

function todayKey(): string {
  return localDayKey(new Date())
}

function readLog(): NotifyLog {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? 'null') as NotifyLog | null
    if (raw && raw.date === todayKey()) return raw
  } catch { /* ignore */ }
  return { date: todayKey(), kinds: [] }
}

function writeLog(log: NotifyLog): void {
  localStorage.setItem(LOG_KEY, JSON.stringify(log))
}

export function notificationsSentToday(): number {
  return readLog().kinds.length
}

function canSend(kind: NotifyKind): boolean {
  const log = readLog()
  if (log.kinds.length >= MAX_PER_DAY) return false
  if (log.kinds.includes(kind)) return false
  return true
}

function record(kind: NotifyKind): void {
  const log = readLog()
  log.kinds.push(kind)
  writeLog(log)
}

const COPY: Record<NotifyKind, (streak: number) => string> = {
  routine: (streak) =>
    streak > 0
      ? `Two minutes to keep your ${streak}-day streak going.`
      // With no streak yet there is nothing to "keep alive" — claiming
      // otherwise is the kind of small lie that costs trust.
      : 'Log anything today and the day counts.',
  save: (streak) =>
    streak > 0
      ? `Your streak's still alive — log anything to keep it.`
      : 'Log anything today and the day counts.',
  freeze: (streak) => `Freeze used. Streak safe at ${streak}.`,
}

export function bannedNotificationCopy(text: string): boolean {
  return /\b(calorie|kcal|weight|over|under|deficit|disappointed|broken your promise)\b/i.test(text)
}

async function deliver(kind: NotifyKind, streak: number): Promise<boolean> {
  if (!canSend(kind)) return false
  if (typeof Notification === 'undefined') return false
  if (Notification.permission !== 'granted') return false

  const body = COPY[kind](streak)
  if (bannedNotificationCopy(body)) return false

  try {
    new Notification('Fud AI', { body, silent: true })
    record(kind)
    track({ name: 'notification_opened', kind })
    return true
  } catch {
    return false
  }
}

/** Median first-log hour over the last 14 days, or 19:00 when data is thin. */
export function routineHour(firstLogHours: number[]): number {
  if (firstLogHours.length < 5) return 19
  const sorted = [...firstLogHours].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
  return Math.min(22, Math.max(8, Math.round(median + 0.5)))
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Evaluates the two allowed nudges. Call on app open and when the hour changes.
 * `loggedToday` suppresses the routine nudge. A freeze available suppresses the save nudge.
 */
export async function evaluateNotifications(input: {
  loggedToday: boolean
  streak: number
  freezeAvailable: number
  firstLogHours: number[]
  localHour: number
  freezeJustApplied?: { protectedStreak: number }
}): Promise<void> {
  if (input.freezeJustApplied) {
    await deliver('freeze', input.freezeJustApplied.protectedStreak)
  }

  if (!input.loggedToday && input.localHour >= routineHour(input.firstLogHours)) {
    await deliver('routine', input.streak)
  }

  if (
    !input.loggedToday
    && input.streak > 0
    && input.freezeAvailable < 1
    && input.localHour >= 20
    && input.localHour < 21
  ) {
    await deliver('save', input.streak)
  }
}
