import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOCAL_MIGRATION_DISABLED_RESPONSE } from '../../api/_lib/cloudControl.js'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    authenticate: vi.fn(),
    record: vi.fn(),
    rate: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/authenticate.js', () => ({
  authenticateRequest: mocks.authenticate,
}))
vi.mock('../../api/_lib/migrations.js', () => ({
  recordMigrationAttempt: mocks.record,
  MigrationConflictError: class MigrationConflictError extends Error {},
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAccountIpRateLimit: mocks.rate,
  enforceAccountUserRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import migrationsHandler from '../../api/migrations.js'

const ATTEMPT = {
  contractVersion: 1,
  migrationId: '20000000-0000-4000-8000-000000000002',
  idempotencyKey: 'device-alpha-1-web-state-v0',
  sourceKind: 'web-state-v0',
  sourceVersion: 'web-state-v0',
  deviceId: 'device-alpha-1',
  stage: 'detected',
  counts: { discovered: 2, accepted: 0, rejected: 0, reconciled: 0 },
  sourceChecksum: null,
  acceptedChecksum: null,
}

describe('local migration fail-closed', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.authenticate.mockResolvedValue({
      sub: '00000000-0000-4000-8000-000000000001',
      sessionId: '10000000-0000-4000-8000-000000000001',
    })
    mocks.record.mockResolvedValue(ATTEMPT)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns the same public refusal while local upload is disabled', async () => {
    const res = response()
    await migrationsHandler(request({
      method: 'POST',
      body: { email: 'person@example.com', ...ATTEMPT },
    }) as never, res as never)

    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(LOCAL_MIGRATION_DISABLED_RESPONSE)
    expect(JSON.stringify(res.body)).not.toContain('person@example.com')
    expect(mocks.authenticate).not.toHaveBeenCalled()
    expect(mocks.record).not.toHaveBeenCalled()
  })

  it('records a count-only ledger row when the flag is explicitly enabled', async () => {
    vi.stubEnv('ENABLE_LOCAL_MIGRATION', 'true')
    const res = response()
    await migrationsHandler(request({
      method: 'POST',
      headers: { authorization: 'Bearer opaque' },
      body: ATTEMPT,
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      ok: true,
      migrationId: ATTEMPT.migrationId,
      stage: 'detected',
      counts: ATTEMPT.counts,
    })
    expect(JSON.stringify(res.body)).not.toContain('food')
  })
})
