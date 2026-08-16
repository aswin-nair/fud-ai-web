/**
 * Versioned, privacy-allowlisted product events.
 *
 * The current sink is a device-local ring buffer. The envelope is deliberately
 * ready for a reviewed production sink, but event payloads cannot contain
 * birth dates, body measurements, food text, photos, API keys, or chat text.
 */

export type LogMethod = 'search' | 'recent' | 'favourite' | 'quick_add' | 'text_ai' | 'photo_ai' | 'saved' | 'manual'

export type AnalyticsEvent =
  | { name: 'welcome_viewed' }
  | { name: 'auth_method_selected'; method: 'email' | 'google'; mode: 'signin' | 'signup' }
  | { name: 'onboarding_step_viewed'; step: string; step_index: number }
  | { name: 'age_gate_passed' | 'age_gate_blocked' }
  | { name: 'target_calculated'; adjusted: boolean }
  | { name: 'target_adjustment_explained'; reasons: string[] }
  | { name: 'first_log_started'; flow_id: string }
  | { name: 'log_method_selected'; flow_id: string; method: LogMethod }
  | { name: 'food_search_performed'; flow_id: string; result_count: number }
  | { name: 'ai_analysis_started' | 'ai_analysis_completed' | 'ai_analysis_failed'; method: 'text_ai' | 'photo_ai' }
  | { name: 'entry_reviewed' | 'entry_corrected'; method: LogMethod }
  | { name: 'entry_saved'; flow_id?: string; method: LogMethod; meal_slot: string; duration_ms?: number; first_log: boolean; event_id: string }
  | { name: 'log_celebration_completed' }
  | { name: 'onboarding_completed' }
  | { name: 'home_primary_action_used' }
  | { name: 'pause_tracking_enabled' }
  | { name: 'streak_freeze_applied'; protected_streak: number }
  | { name: 'support_opened' }
  | { name: 'export_completed' }
  | { name: 'account_deletion_completed' }
  // Temporary compatibility events. These can be removed after dashboards
  // have migrated to the versioned funnel names above.
  | { name: 'streak_extended'; count: number }
  | { name: 'streak_broken'; previous: number }
  | { name: 'freeze_applied'; protectedStreak: number }
  | { name: 'quest_completed'; type: string }
  | { name: 'goal_adjusted' | 'goal_clamped' }
  | { name: 'notification_opened'; kind: string }
  | { name: 'tracking_paused' }

export interface TrackedEvent {
  schema_version: 1
  event_id: string
  at: string
  app_surface: string
  app_version: string
  platform: 'web'
  event: AnalyticsEvent
}

interface LogFlow {
  id: string
  startedAt: number
  method: LogMethod
  firstLog: boolean
  methodTracked?: boolean
}

const KEY = 'fud-analytics-v1'
const LEGACY_KEY = 'fud-analytics'
const FLOW_KEY = 'fud-log-flow-v1'
const MAX = 200

function makeId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function eventId(event: AnalyticsEvent): string {
  return 'event_id' in event ? event.event_id : makeId()
}

function readRows(): TrackedEvent[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as TrackedEvent[]
  } catch {
    return []
  }
}

export function track(event: AnalyticsEvent): void {
  if (typeof localStorage === 'undefined') return
  const id = eventId(event)
  try {
    const prev = readRows()
    if (prev.some(row => row.event_id === id)) return

    const row: TrackedEvent = {
      schema_version: 1,
      event_id: id,
      at: new Date().toISOString(),
      app_surface: typeof location === 'undefined' ? 'unknown' : location.pathname,
      app_version: import.meta.env.VITE_APP_VERSION ?? 'dev',
      platform: 'web',
      event,
    }
    localStorage.setItem(KEY, JSON.stringify([row, ...prev].slice(0, MAX)))
  } catch { /* analytics never blocks the product */ }
}

export function recentEvents(limit = 20): TrackedEvent[] {
  return readRows().slice(0, limit)
}

export function clearAnalytics(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(FLOW_KEY)
}

function writeFlow(flow: LogFlow): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow))
}

function readFlow(): LogFlow | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return JSON.parse(sessionStorage.getItem(FLOW_KEY) ?? 'null') as LogFlow | null
  } catch {
    return null
  }
}

export function startLogFlow(method: LogMethod = 'search', firstLog = false): LogFlow {
  const existing = readFlow()
  if (existing) return existing
  const flow = { id: makeId(), startedAt: Date.now(), method, firstLog }
  writeFlow(flow)
  if (firstLog) track({ name: 'first_log_started', flow_id: flow.id })
  return flow
}

export function selectLogMethod(method: LogMethod): void {
  const flow = readFlow() ?? startLogFlow(method)
  if (flow.method === method && flow.methodTracked) return
  const next = { ...flow, method, methodTracked: true }
  writeFlow(next)
  track({ name: 'log_method_selected', flow_id: next.id, method })
}

export function finishLogFlow(input: {
  entryId: string
  source: string
  mealSlot: string
  firstLog: boolean
}): void {
  const flow = readFlow()
  const method = flow?.method ?? sourceToMethod(input.source)
  track({
    name: 'entry_saved',
    event_id: `entry-saved-${input.entryId}`,
    flow_id: flow?.id,
    method,
    meal_slot: input.mealSlot,
    duration_ms: flow ? Math.max(0, Date.now() - flow.startedAt) : undefined,
    first_log: input.firstLog,
  })
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(FLOW_KEY)
}

function sourceToMethod(source: string): LogMethod {
  switch (source) {
    case 'textInput': return 'text_ai'
    case 'snapFood': return 'photo_ai'
    case 'quickAdd': return 'quick_add'
    case 'recent': return 'recent'
    default: return 'manual'
  }
}
