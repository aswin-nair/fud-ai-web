import {
  buildTelemetryEnvelope,
  deliverRemoteTelemetry,
  isRemoteTelemetryEnabled,
  type LogMethod,
  type ProductEvent,
  type TelemetryEnvelope,
} from '@fud-ai/contracts'

export type { LogMethod, ProductEvent as AnalyticsEvent }

export type TrackedEvent = TelemetryEnvelope

interface LogFlow {
  id: string
  startedAt: number
  method: LogMethod
  firstLog: boolean
  methodTracked?: boolean
}

const KEY = 'fud-analytics-v1'
const LEGACY_KEY = 'fud-analytics'
const CRASH_KEY = 'fud-crashes-v1'
const FLOW_KEY = 'fud-log-flow-v1'
const MAX = 200

function makeId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function environment(): TelemetryEnvelope['environment'] {
  const mode = import.meta.env.MODE
  if (mode === 'production') return 'production'
  if (mode === 'test') return 'test'
  return 'dev'
}

function release(): string {
  const raw = String(import.meta.env.VITE_APP_VERSION ?? 'dev').trim()
  return /^[A-Za-z0-9._-]{1,64}$/.test(raw) ? raw : 'dev'
}

function appSurface(): string | undefined {
  if (typeof location === 'undefined') return undefined
  const path = location.pathname
  return /^\/[A-Za-z0-9/_-]{0,63}$/.test(path) ? path : undefined
}

function readRows(key = KEY): TrackedEvent[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((row): row is TrackedEvent => (
      Boolean(row)
      && typeof row === 'object'
      && (row as TrackedEvent).schema_version === 1
      && typeof (row as TrackedEvent).event_id === 'string'
    ))
  } catch {
    return []
  }
}

function writeRows(key: string, rows: TrackedEvent[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(rows.slice(0, MAX)))
}

function persist(envelope: TrackedEvent, key = KEY): void {
  const prev = readRows(key)
  if (prev.some(row => row.event_id === envelope.event_id)) return
  writeRows(key, [envelope, ...prev])
}

export function track(event: ProductEvent): void {
  if (typeof localStorage === 'undefined') return
  const built = buildTelemetryEnvelope({
    event,
    eventId: 'event_id' in event ? event.event_id : makeId(),
    environment: environment(),
    release: release(),
    platform: 'web',
    appSurface: appSurface(),
  })
  if (!built.ok) return
  try {
    persist(built.value)
    if (isRemoteTelemetryEnabled(import.meta.env.VITE_ENABLE_REMOTE_TELEMETRY)) {
      deliverRemoteTelemetry(built.value)
    }
  } catch { /* analytics never blocks the product */ }
}

export function recentEvents(limit = 20): TrackedEvent[] {
  return readRows().slice(0, limit)
}

export function recordCrash(errorName: string, handled: boolean): void {
  const crashId = makeId()
  const built = buildTelemetryEnvelope({
    event: {
      name: 'client_crash',
      crash_id: crashId,
      error_name: errorName,
      handled,
    },
    eventId: crashId,
    environment: environment(),
    release: release(),
    platform: 'web',
    appSurface: appSurface(),
  })
  if (!built.ok) return
  try {
    persist(built.value, CRASH_KEY)
  } catch { /* crash reporting never blocks the product */ }
}

export function recentCrashes(limit = 20): TrackedEvent[] {
  return readRows(CRASH_KEY).slice(0, limit)
}

export function clearAnalytics(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
  localStorage.removeItem(CRASH_KEY)
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

export function recordFoodSearch(resultCount: number): void {
  const flow = readFlow() ?? startLogFlow('search')
  track({
    name: 'food_search_performed',
    flow_id: flow.id,
    result_count: resultCount,
  })
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

export function sourceToMethod(source: string): LogMethod {
  switch (source) {
    case 'textInput': return 'text_ai'
    case 'snapFood': return 'photo_ai'
    case 'quickAdd': return 'quick_add'
    case 'recent': return 'recent'
    default: return 'manual'
  }
}
