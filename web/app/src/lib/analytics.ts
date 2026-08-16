/**
 * Phase 9: fire the events the spec names. The destination is a local ring
 * buffer — there is no analytics vendor in this app — so day-1 / day-7 /
 * day-30 return can be read later without shipping PII off-device.
 */

export type AnalyticsEvent =
  | { name: 'meal_logged'; slot: string; source: string; seconds_to_log?: number }
  | { name: 'streak_extended'; count: number }
  | { name: 'streak_broken'; previous: number }
  | { name: 'freeze_applied'; protectedStreak: number }
  | { name: 'quest_completed'; type: string }
  | { name: 'goal_adjusted' }
  | { name: 'goal_clamped' }
  | { name: 'notification_opened'; kind: string }
  | { name: 'tracking_paused' }

const KEY = 'fud-analytics'
const MAX = 200

export function track(event: AnalyticsEvent): void {
  const row = { ...event, at: new Date().toISOString() }
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[]
    const next = [row, ...prev].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch { /* ignore quota */ }
}

export function recentEvents(limit = 20): unknown[] {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[]).slice(0, limit)
  } catch {
    return []
  }
}
