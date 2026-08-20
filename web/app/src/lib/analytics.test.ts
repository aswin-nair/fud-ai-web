import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildTelemetryEnvelope,
  deliverRemoteTelemetry,
  isRemoteTelemetryEnabled,
  validateTelemetryEnvelope,
} from '@fud-ai/contracts'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  clearAnalytics,
  finishLogFlow,
  recentCrashes,
  recentEvents,
  recordCrash,
  recordFoodSearch,
  selectLogMethod,
  startLogFlow,
} from './analytics'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/contracts/fixtures/telemetry-redaction.v1.json'),
  'utf8',
)) as { injections: Array<{ id: string; field?: string; value: string | number }> }

describe('analytics funnel', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
    vi.stubGlobal('location', { pathname: '/log/manual' })
    clearAnalytics()
  })

  it('records an entry save exactly once with allowlisted metadata', () => {
    startLogFlow('search', true)
    selectLogMethod('manual')

    const save = {
      entryId: 'entry-1',
      source: 'manual',
      mealSlot: 'lunch',
      firstLog: true,
    }
    finishLogFlow(save)
    finishLogFlow(save)

    const saved = recentEvents().filter(row => row.event.name === 'entry_saved')
    expect(saved).toHaveLength(1)
    expect(saved[0]?.event).toMatchObject({
      name: 'entry_saved',
      method: 'manual',
      meal_slot: 'lunch',
      first_log: true,
    })
    expect(saved[0]?.platform).toBe('web')
    expect(JSON.stringify(saved[0])).not.toMatch(/food|photo|api.?key|birth|weight/i)
  })

  it('records a search count without the query text', () => {
    startLogFlow('search')
    recordFoodSearch(3)
    const search = recentEvents().find(row => row.event.name === 'food_search_performed')
    expect(search?.event).toMatchObject({ name: 'food_search_performed', result_count: 3 })
    expect(JSON.stringify(search)).not.toContain('chicken')
    expect(JSON.stringify(search)).not.toContain('biryani')
  })

  it('stores only a sanitized crash name', () => {
    recordCrash('TypeError', false)
    const crash = recentCrashes()[0]
    expect(crash?.event).toMatchObject({ name: 'client_crash', error_name: 'TypeError', handled: false })
    expect(JSON.stringify(crash)).not.toContain('chicken biryani')
    expect(JSON.stringify(crash)).not.toContain('stack')
  })
})

describe('telemetry contract redaction', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.injections.length).toBeGreaterThan(0)
  })

  it.each(fixture.injections)('rejects $id when injected as an unknown field', injection => {
    const field = injection.field ?? injection.id
    const built = buildTelemetryEnvelope({
      event: {
        name: 'support_opened',
        [field]: injection.value,
      } as never,
      eventId: 'evt-redact-0001',
      environment: 'test',
      release: 'dev',
      platform: 'web',
    })
    expect(built.ok).toBe(false)
    if (built.ok) return
    expect(JSON.stringify(built)).not.toContain(String(injection.value))
  })

  it('keeps a valid envelope free of forbidden patterns', () => {
    const built = validateTelemetryEnvelope({
      schema_version: 1,
      event_id: 'evt-valid-0001',
      occurred_at: '2026-08-20T12:00:00.000Z',
      environment: 'test',
      release: 'dev',
      platform: 'web',
      app_surface: '/support',
      event: { name: 'support_opened' },
    })
    expect(built.ok).toBe(true)
  })

  it('keeps the remote sink fail-closed', () => {
    expect(isRemoteTelemetryEnabled(undefined)).toBe(false)
    expect(isRemoteTelemetryEnabled('true')).toBe(true)
    const built = buildTelemetryEnvelope({
      event: { name: 'export_completed' },
      eventId: 'evt-remote-0001',
      environment: 'test',
      release: 'dev',
      platform: 'web',
    })
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(deliverRemoteTelemetry(built.value)).toEqual({
      delivered: false,
      reason: 'remote_telemetry_disabled',
    })
  })
})
