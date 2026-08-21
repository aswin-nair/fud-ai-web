import { describe, expect, it, vi } from 'vitest'

import { ALERT_CATALOG, evaluateAlertRules } from '@fud-ai/contracts'
import { request, response } from './helpers.js'
import healthHandler from '../../api/health.js'

vi.mock('../../api/_lib/ensureAuthSchema.js', () => ({
  prepareAuth: async () => true,
}))

import loginHandler from '../../api/_auth/login.js'

describe('API request telemetry', () => {
  it('logs an allowlisted health request without secrets', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubEnv('DATABASE_URL', 'postgres://user:secret-token@host/db')
    vi.stubEnv('RELEASE_ID', 'phase8dev')

    const res = response()
    await healthHandler(request({
      headers: { 'x-request-id': 'req-live-12345678' },
    }) as never, res as never)

    const logged = spy.mock.calls
      .map(call => String(call[0]))
      .find(line => line.includes('"name":"api_request"'))
    expect(logged).toBeTruthy()
    const envelope = JSON.parse(logged as string) as {
      event: { name: string; route: string; status: number; request_id: string }
    }
    expect(envelope.event).toMatchObject({
      name: 'api_request',
      route: '/api/health',
      status: 200,
      request_id: 'req-live-12345678',
    })
    expect(logged).not.toContain('postgres://')
    expect(logged).not.toContain('secret-token')
    expect(logged).not.toContain('DATABASE_URL')
    expect(logged).not.toContain('authorization')
    spy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('classifies a validation failure without the request body', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = response()
    await loginHandler(request({
      method: 'POST',
      body: { email: 'alex@example.com', password: 'hunter2-secret' },
    }) as never, res as never)

    const logged = spy.mock.calls
      .map(call => String(call[0]))
      .find(line => line.includes('"name":"api_request"'))
    expect(logged).toBeTruthy()
    expect(logged).not.toContain('alex@example.com')
    expect(logged).not.toContain('hunter2-secret')
    spy.mockRestore()
  })
})

describe('alert catalog', () => {
  it('keeps every rule unassigned and the sink disabled', () => {
    expect(ALERT_CATALOG.sink).toBe('disabled')
    expect(ALERT_CATALOG.privacyApproval).toBe('pending')
    expect(ALERT_CATALOG.rules.every(rule => rule.owner === 'UNASSIGNED')).toBe(true)
  })

  it('fires the documented thresholds on synthetic metrics', () => {
    expect(evaluateAlertRules({
      api5xxRate: 0.03,
      databaseReady: false,
      managedAiInvocations: 1,
      crashFreeRate: 0.99,
    })).toEqual([
      'api-5xx',
      'db-ready',
      'managed-ai-invoked',
      'crash-free',
    ])
    expect(evaluateAlertRules({
      api5xxRate: 0.01,
      databaseReady: true,
      managedAiInvocations: 0,
      crashFreeRate: 0.999,
    })).toEqual([])
  })
})
