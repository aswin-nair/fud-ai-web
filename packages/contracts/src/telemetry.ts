export const TELEMETRY_SCHEMA_VERSION = 1 as const

export const LOG_METHODS = [
  'search',
  'recent',
  'favourite',
  'quick_add',
  'text_ai',
  'photo_ai',
  'saved',
  'manual',
] as const

export type LogMethod = (typeof LOG_METHODS)[number]

export const CLAMP_REASONS = ['rate', 'deficit', 'floor', 'bmr'] as const
export type ClampReasonCode = (typeof CLAMP_REASONS)[number]

export const TELEMETRY_ENVIRONMENTS = ['dev', 'staging', 'production', 'test'] as const
export type TelemetryEnvironment = (typeof TELEMETRY_ENVIRONMENTS)[number]

export const TELEMETRY_PLATFORMS = ['web', 'api', 'mobile'] as const
export type TelemetryPlatform = (typeof TELEMETRY_PLATFORMS)[number]

export const DURATION_BUCKETS = ['0-100', '100-400', '400-1500', '1500+'] as const
export type DurationBucket = (typeof DURATION_BUCKETS)[number]

export const API_RESULT_CLASSES = [
  'ok',
  'client_error',
  'server_error',
  'conflict',
  'rate_limited',
  'unavailable',
] as const
export type ApiResultClass = (typeof API_RESULT_CLASSES)[number]

export type ProductEvent =
  | { name: 'welcome_viewed' }
  | { name: 'auth_method_selected'; method: 'email' | 'google'; mode: 'signin' | 'signup' }
  | { name: 'onboarding_step_viewed'; step: string; step_index: number }
  | { name: 'age_gate_passed' | 'age_gate_blocked' }
  | { name: 'target_calculated'; adjusted: boolean }
  | { name: 'target_adjustment_explained'; reasons: ClampReasonCode[] }
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
  | { name: 'quest_completed'; type: string }
  | { name: 'goal_clamped' }
  | { name: 'support_opened' }
  | { name: 'export_completed' }
  | { name: 'account_deletion_completed' }

export type OperationalEvent =
  | {
      name: 'api_request'
      request_id: string
      route: string
      method: string
      status: number
      duration_ms: number
      duration_bucket: DurationBucket
      result_class: ApiResultClass
      error_class?: string
      release: string
    }
  | {
      name: 'client_crash'
      crash_id: string
      error_name: string
      handled: boolean
    }
  | {
      name: 'managed_ai_invoked'
      request_id: string
      status: number
    }

export type TelemetryEvent = ProductEvent | OperationalEvent

export interface TelemetryEnvelope {
  schema_version: typeof TELEMETRY_SCHEMA_VERSION
  event_id: string
  occurred_at: string
  environment: TelemetryEnvironment
  release: string
  platform: TelemetryPlatform
  app_surface?: string
  event: TelemetryEvent
}

export type TelemetryValidation =
  | { ok: true; value: TelemetryEnvelope }
  | { ok: false; error: string }

const EVENT_ID = /^[A-Za-z0-9._:-]{8,128}$/
const FLOW_ID = /^[A-Za-z0-9._:-]{8,128}$/
const REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/
const ROUTE = /^\/api\/[A-Za-z0-9/_-]{1,62}$/
const SURFACE = /^\/[A-Za-z0-9/_-]{0,63}$/
const RELEASE = /^[A-Za-z0-9._-]{1,64}$/
const STEP = /^[A-Za-z0-9 _-]{1,32}$/
const QUEST_TYPE = /^(log_n_meals|log_before|log_streak)$/
const MEAL_SLOT = /^(breakfast|lunch|dinner|snack|other)$/
const HTTP_METHOD = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/
const ERROR_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/

const FORBIDDEN = [
  /postgres(?:ql)?:\/\//i,
  /DATABASE_URL/i,
  /\bBearer\s+[A-Za-z0-9._-]+\b/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\./,
  /\bsk-[A-Za-z0-9_-]{8,}\b/,
  /data:image\//i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function keysOf(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort()
}

function expectKeys(value: Record<string, unknown>, required: string[], optional: string[] = []): string | null {
  const allowed = new Set([...required, ...optional])
  for (const key of keysOf(value)) {
    if (!allowed.has(key)) return `Unknown telemetry field: ${key}`
  }
  for (const key of required) {
    if (!(key in value)) return `Missing telemetry field: ${key}`
  }
  return null
}

export function durationBucket(durationMs: number): DurationBucket {
  if (durationMs < 100) return '0-100'
  if (durationMs < 400) return '100-400'
  if (durationMs < 1500) return '400-1500'
  return '1500+'
}

export function resultClassForStatus(status: number): ApiResultClass {
  if (status === 409) return 'conflict'
  if (status === 429) return 'rate_limited'
  if (status === 503) return 'unavailable'
  if (status >= 500) return 'server_error'
  if (status >= 400) return 'client_error'
  return 'ok'
}

export function sanitizeCrashName(name: unknown): string {
  const raw = typeof name === 'string' ? name : 'Error'
  const token = raw.trim().split(/[\s:]/)[0] ?? 'Error'
  const cleaned = token.replace(/[^A-Za-z]/g, '').slice(0, 64)
  if (cleaned === 'DOMException' || /^[A-Z][A-Za-z]{0,48}Error$/.test(cleaned)) return cleaned
  return 'Error'
}

export function isRemoteTelemetryEnabled(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() === 'true'
}

export function deliverRemoteTelemetry(_envelope: TelemetryEnvelope): {
  delivered: false
  reason: 'remote_telemetry_disabled' | 'sink_not_configured'
} {
  return { delivered: false, reason: 'remote_telemetry_disabled' }
}

export function telemetryContainsForbiddenContent(serialized: string): boolean {
  return FORBIDDEN.some(pattern => pattern.test(serialized))
}

function validateProductEvent(value: Record<string, unknown>): ProductEvent | string {
  const name = value.name
  if (typeof name !== 'string') return 'Telemetry event name is required'

  if (name === 'welcome_viewed' || name === 'age_gate_passed' || name === 'age_gate_blocked'
    || name === 'log_celebration_completed' || name === 'onboarding_completed'
    || name === 'home_primary_action_used' || name === 'pause_tracking_enabled'
    || name === 'goal_clamped' || name === 'support_opened' || name === 'export_completed'
    || name === 'account_deletion_completed') {
    return expectKeys(value, ['name']) ?? (value as ProductEvent)
  }

  if (name === 'auth_method_selected') {
    const error = expectKeys(value, ['name', 'method', 'mode'])
    if (error) return error
    if (value.method !== 'email' && value.method !== 'google') return 'Invalid auth method'
    if (value.mode !== 'signin' && value.mode !== 'signup') return 'Invalid auth mode'
    return value as ProductEvent
  }

  if (name === 'onboarding_step_viewed') {
    const error = expectKeys(value, ['name', 'step', 'step_index'])
    if (error) return error
    if (typeof value.step !== 'string' || !STEP.test(value.step)) return 'Invalid onboarding step'
    if (!Number.isInteger(value.step_index) || (value.step_index as number) < 0 || (value.step_index as number) > 20) {
      return 'Invalid onboarding step index'
    }
    return value as ProductEvent
  }

  if (name === 'target_calculated') {
    const error = expectKeys(value, ['name', 'adjusted'])
    if (error) return error
    if (typeof value.adjusted !== 'boolean') return 'Invalid target adjustment flag'
    return value as ProductEvent
  }

  if (name === 'target_adjustment_explained') {
    const error = expectKeys(value, ['name', 'reasons'])
    if (error) return error
    if (!Array.isArray(value.reasons) || value.reasons.length > 8) return 'Invalid clamp reasons'
    if (!value.reasons.every(reason => typeof reason === 'string' && (CLAMP_REASONS as readonly string[]).includes(reason))) {
      return 'Invalid clamp reason'
    }
    return value as ProductEvent
  }

  if (name === 'first_log_started') {
    const error = expectKeys(value, ['name', 'flow_id'])
    if (error) return error
    if (typeof value.flow_id !== 'string' || !FLOW_ID.test(value.flow_id)) return 'Invalid flow id'
    return value as ProductEvent
  }

  if (name === 'log_method_selected' || name === 'food_search_performed') {
    const required = name === 'food_search_performed'
      ? ['name', 'flow_id', 'result_count']
      : ['name', 'flow_id', 'method']
    const error = expectKeys(value, required)
    if (error) return error
    if (typeof value.flow_id !== 'string' || !FLOW_ID.test(value.flow_id)) return 'Invalid flow id'
    if (name === 'log_method_selected' && !(LOG_METHODS as readonly string[]).includes(value.method as string)) {
      return 'Invalid log method'
    }
    if (name === 'food_search_performed') {
      if (!Number.isInteger(value.result_count) || (value.result_count as number) < 0 || (value.result_count as number) > 1000) {
        return 'Invalid search result count'
      }
    }
    return value as ProductEvent
  }

  if (name === 'ai_analysis_started' || name === 'ai_analysis_completed' || name === 'ai_analysis_failed') {
    const error = expectKeys(value, ['name', 'method'])
    if (error) return error
    if (value.method !== 'text_ai' && value.method !== 'photo_ai') return 'Invalid AI method'
    return value as ProductEvent
  }

  if (name === 'entry_reviewed' || name === 'entry_corrected') {
    const error = expectKeys(value, ['name', 'method'])
    if (error) return error
    if (!(LOG_METHODS as readonly string[]).includes(value.method as string)) return 'Invalid log method'
    return value as ProductEvent
  }

  if (name === 'entry_saved') {
    const error = expectKeys(value, ['name', 'method', 'meal_slot', 'first_log', 'event_id'], ['flow_id', 'duration_ms'])
    if (error) return error
    if (!(LOG_METHODS as readonly string[]).includes(value.method as string)) return 'Invalid log method'
    if (typeof value.meal_slot !== 'string' || !MEAL_SLOT.test(value.meal_slot)) return 'Invalid meal slot'
    if (typeof value.first_log !== 'boolean') return 'Invalid first-log flag'
    if (typeof value.event_id !== 'string' || !EVENT_ID.test(value.event_id)) return 'Invalid event id'
    if (value.flow_id !== undefined && (typeof value.flow_id !== 'string' || !FLOW_ID.test(value.flow_id))) {
      return 'Invalid flow id'
    }
    if (value.duration_ms !== undefined && (!Number.isInteger(value.duration_ms) || (value.duration_ms as number) < 0 || (value.duration_ms as number) > 3_600_000)) {
      return 'Invalid duration'
    }
    return value as ProductEvent
  }

  if (name === 'streak_freeze_applied') {
    const error = expectKeys(value, ['name', 'protected_streak'])
    if (error) return error
    if (!Number.isInteger(value.protected_streak) || (value.protected_streak as number) < 0 || (value.protected_streak as number) > 10_000) {
      return 'Invalid protected streak'
    }
    return value as ProductEvent
  }

  if (name === 'quest_completed') {
    const error = expectKeys(value, ['name', 'type'])
    if (error) return error
    if (typeof value.type !== 'string' || !QUEST_TYPE.test(value.type)) return 'Invalid quest type'
    return value as ProductEvent
  }

  return `Unknown telemetry event: ${name}`
}

function validateOperationalEvent(value: Record<string, unknown>): OperationalEvent | string {
  const name = value.name
  if (name === 'api_request') {
    const error = expectKeys(value, [
      'name', 'request_id', 'route', 'method', 'status', 'duration_ms',
      'duration_bucket', 'result_class', 'release',
    ], ['error_class'])
    if (error) return error
    if (typeof value.request_id !== 'string' || !REQUEST_ID.test(value.request_id)) return 'Invalid request id'
    if (typeof value.route !== 'string' || !ROUTE.test(value.route)) return 'Invalid API route'
    if (typeof value.method !== 'string' || !HTTP_METHOD.test(value.method)) return 'Invalid HTTP method'
    if (!Number.isInteger(value.status) || (value.status as number) < 100 || (value.status as number) > 599) {
      return 'Invalid status'
    }
    if (!Number.isInteger(value.duration_ms) || (value.duration_ms as number) < 0 || (value.duration_ms as number) > 120_000) {
      return 'Invalid duration'
    }
    if (!(DURATION_BUCKETS as readonly string[]).includes(value.duration_bucket as string)) return 'Invalid duration bucket'
    if (!(API_RESULT_CLASSES as readonly string[]).includes(value.result_class as string)) return 'Invalid result class'
    if (typeof value.release !== 'string' || !RELEASE.test(value.release)) return 'Invalid release'
    if (value.error_class !== undefined && (typeof value.error_class !== 'string' || !ERROR_NAME.test(value.error_class))) {
      return 'Invalid error class'
    }
    return value as OperationalEvent
  }

  if (name === 'client_crash') {
    const error = expectKeys(value, ['name', 'crash_id', 'error_name', 'handled'])
    if (error) return error
    if (typeof value.crash_id !== 'string' || !EVENT_ID.test(value.crash_id)) return 'Invalid crash id'
    if (typeof value.error_name !== 'string' || !ERROR_NAME.test(value.error_name)) return 'Invalid error name'
    if (typeof value.handled !== 'boolean') return 'Invalid handled flag'
    return value as OperationalEvent
  }

  if (name === 'managed_ai_invoked') {
    const error = expectKeys(value, ['name', 'request_id', 'status'])
    if (error) return error
    if (typeof value.request_id !== 'string' || !REQUEST_ID.test(value.request_id)) return 'Invalid request id'
    if (!Number.isInteger(value.status) || (value.status as number) < 100 || (value.status as number) > 599) {
      return 'Invalid status'
    }
    return value as OperationalEvent
  }

  return `Unknown operational event: ${String(name)}`
}

export function validateTelemetryEnvelope(value: unknown): TelemetryValidation {
  if (!isRecord(value)) return { ok: false, error: 'Telemetry envelope must be an object' }
  const headerError = expectKeys(value, [
    'schema_version', 'event_id', 'occurred_at', 'environment', 'release', 'platform', 'event',
  ], ['app_surface'])
  if (headerError) return { ok: false, error: headerError }
  if (value.schema_version !== TELEMETRY_SCHEMA_VERSION) return { ok: false, error: 'Unsupported telemetry schema' }
  if (typeof value.event_id !== 'string' || !EVENT_ID.test(value.event_id)) return { ok: false, error: 'Invalid event id' }
  if (typeof value.occurred_at !== 'string' || Number.isNaN(Date.parse(value.occurred_at))) {
    return { ok: false, error: 'Invalid occurred_at' }
  }
  if (!(TELEMETRY_ENVIRONMENTS as readonly string[]).includes(value.environment as string)) {
    return { ok: false, error: 'Invalid environment' }
  }
  if (typeof value.release !== 'string' || !RELEASE.test(value.release)) return { ok: false, error: 'Invalid release' }
  if (!(TELEMETRY_PLATFORMS as readonly string[]).includes(value.platform as string)) {
    return { ok: false, error: 'Invalid platform' }
  }
  if (value.app_surface !== undefined && (typeof value.app_surface !== 'string' || !SURFACE.test(value.app_surface))) {
    return { ok: false, error: 'Invalid app surface' }
  }
  if (!isRecord(value.event)) return { ok: false, error: 'Telemetry event must be an object' }

  const event = value.event.name === 'api_request' || value.event.name === 'client_crash' || value.event.name === 'managed_ai_invoked'
    ? validateOperationalEvent(value.event)
    : validateProductEvent(value.event)
  if (typeof event === 'string') return { ok: false, error: event }

  const envelope: TelemetryEnvelope = {
    schema_version: 1,
    event_id: value.event_id,
    occurred_at: value.occurred_at,
    environment: value.environment as TelemetryEnvironment,
    release: value.release,
    platform: value.platform as TelemetryPlatform,
    ...(value.app_surface ? { app_surface: value.app_surface } : {}),
    event,
  }
  const serialized = JSON.stringify(envelope)
  if (telemetryContainsForbiddenContent(serialized)) {
    return { ok: false, error: 'Telemetry envelope contains forbidden content' }
  }
  return { ok: true, value: envelope }
}

export function buildTelemetryEnvelope(input: {
  event: TelemetryEvent
  eventId?: string
  occurredAt?: string
  environment: TelemetryEnvironment
  release: string
  platform: TelemetryPlatform
  appSurface?: string
}): TelemetryValidation {
  const eventId = input.event.name === 'entry_saved'
    ? input.event.event_id
    : (input.eventId ?? '')
  return validateTelemetryEnvelope({
    schema_version: 1,
    event_id: eventId,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    environment: input.environment,
    release: input.release,
    platform: input.platform,
    ...(input.appSurface ? { app_surface: input.appSurface } : {}),
    event: input.event,
  })
}
