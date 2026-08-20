import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTRACT_VERSION } from '@fud-ai/contracts'
import { ENTITY_PROJECTION_DISABLED_RESPONSE } from '../../api/_lib/cloudControl.js'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    authenticate: vi.fn(),
    apply: vi.fn(),
    rate: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/authenticate.js', () => ({
  authenticateRequest: mocks.authenticate,
}))
vi.mock('../../api/_lib/entities.js', () => ({
  applyEntityMutation: mocks.apply,
  EntityMutationConflict: class EntityMutationConflict extends Error {},
  EntityVersionConflict: class EntityVersionConflict extends Error {},
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAccountIpRateLimit: mocks.rate,
  enforceAccountUserRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import entitiesHandler from '../../api/entities.js'

const mutation = {
  contractVersion: 1,
  mutationId: '10000000-0000-4000-8000-000000000001',
  deviceId: 'device-alpha-1',
  baseCursor: 0,
  kind: 'upsert',
  entity: {
    contractVersion: CONTRACT_VERSION,
    entityType: 'food_entry',
    entityId: 'food-entry-1',
    deviceId: 'device-alpha-1',
    localDate: '2026-10-31',
    timeZone: 'America/Los_Angeles',
    createdAt: '2026-11-01T06:30:00.000Z',
    updatedAt: '2026-11-01T06:30:00.000Z',
    deletedAt: null,
    recordVersion: 1,
    payload: { name: 'Oats', calories: 250 },
  },
}

describe('entity batch fail-closed', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.authenticate.mockResolvedValue({
      sub: '00000000-0000-4000-8000-000000000001',
      sessionId: '10000000-0000-4000-8000-000000000001',
    })
    mocks.apply.mockResolvedValue({
      mutationId: mutation.mutationId,
      cursor: 1,
      replayed: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns the same public refusal while entity projection is disabled', async () => {
    const res = response()
    await entitiesHandler(request({
      method: 'POST',
      body: { mutations: [mutation] },
    }) as never, res as never)

    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(ENTITY_PROJECTION_DISABLED_RESPONSE)
    expect(mocks.authenticate).not.toHaveBeenCalled()
    expect(mocks.apply).not.toHaveBeenCalled()
  })

  it('applies an authenticated batch when the flag is explicitly enabled', async () => {
    vi.stubEnv('ENABLE_ENTITY_PROJECTION', 'true')
    const res = response()
    await entitiesHandler(request({
      method: 'POST',
      headers: { authorization: 'Bearer opaque' },
      body: { mutations: [mutation] },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      acks: [{ mutationId: mutation.mutationId, cursor: 1, replayed: false }],
    })
    expect(mocks.apply).toHaveBeenCalledTimes(1)
  })
})
