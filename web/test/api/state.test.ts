import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { response, stateFixture } from './helpers.js'

const mocks = vi.hoisted(() => {
  class StateVersionConflict extends Error {}
  class StateMutationConflict extends Error {}
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    authenticate: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    ipRateLimit: vi.fn(),
    userRateLimit: vi.fn(),
    StateVersionConflict,
    StateMutationConflict,
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/authenticate.js', () => ({ authenticateRequest: mocks.authenticate }))
vi.mock('../../api/_lib/state.js', () => ({
  loadUserState: mocks.load,
  saveUserState: mocks.save,
  StateVersionConflict: mocks.StateVersionConflict,
  StateMutationConflict: mocks.StateMutationConflict,
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceStateIpRateLimit: mocks.ipRateLimit,
  enforceStateUserRateLimit: mocks.userRateLimit,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import stateHandler from '../../api/state.js'
import { InvalidSessionError } from '../../api/_lib/jwt.js'

const USER_A = '00000000-0000-4000-8000-000000000001'
const USER_B = '00000000-0000-4000-8000-000000000002'
const MUTATION_ID = '10000000-0000-4000-8000-000000000001'

describe('state API boundary', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.authenticate.mockResolvedValue({ sub: USER_A, sessionId: MUTATION_ID })
    mocks.ipRateLimit.mockResolvedValue(undefined)
    mocks.userRateLimit.mockResolvedValue(undefined)
    mocks.load.mockResolvedValue({ state: stateFixture(), version: 4 })
    mocks.save.mockResolvedValue({ version: 5, replayed: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('always scopes state reads to the authenticated subject', async () => {
    const res = response()
    await stateHandler({
      method: 'GET',
      headers: { authorization: 'Bearer opaque' },
      query: { userId: USER_B },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(mocks.load).toHaveBeenCalledWith(USER_A)
    expect(mocks.load).not.toHaveBeenCalledWith(USER_B)
  })

  it('applies the IP limit before rejecting an unauthenticated state request', async () => {
    mocks.authenticate.mockRejectedValue(new InvalidSessionError())
    const res = response()
    await stateHandler({ method: 'GET', headers: {} } as never, res as never)
    expect(res.statusCode).toBe(401)
    expect(mocks.ipRateLimit).toHaveBeenCalledOnce()
    expect(mocks.userRateLimit).not.toHaveBeenCalled()
  })

  it('requires a canonical mutation UUID before writing', async () => {
    const res = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: { state: stateFixture(), baseVersion: 4, mutationId: 'retry-1' },
    } as never, res as never)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Missing or invalid mutationId' })
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('rejects BYOK secret material before attempting a database write', async () => {
    const res = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: {
        state: stateFixture('sk-device-only-secret'),
        baseVersion: 4,
        mutationId: MUTATION_ID,
      },
    } as never, res as never)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid state: private API keys cannot be synced' })
    expect(mocks.save).not.toHaveBeenCalled()
  })

  it('ignores caller user IDs and saves only under the authenticated subject', async () => {
    const state = stateFixture()
    const res = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: { state, baseVersion: 4, mutationId: MUTATION_ID, userId: USER_B },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, version: 5 })
    expect(mocks.save).toHaveBeenCalledWith(USER_A, state, 4, MUTATION_ID)
  })

  it('returns the original version for a duplicate-safe replay', async () => {
    mocks.save.mockResolvedValue({ version: 5, replayed: true })
    const res = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: { state: stateFixture(), baseVersion: 4, mutationId: MUTATION_ID },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true, version: 5 })
  })

  it('stops mutations but leaves reads available when cloud writes are disabled', async () => {
    vi.stubEnv('ENABLE_CLOUD_WRITES', 'false')
    const writeRes = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: { state: stateFixture(), baseVersion: 4, mutationId: MUTATION_ID },
    } as never, writeRes as never)

    expect(writeRes.statusCode).toBe(503)
    expect(writeRes.body).toEqual({
      error: 'Cloud writes are temporarily unavailable. Your account data remains readable.',
    })
    expect(mocks.save).not.toHaveBeenCalled()

    const readRes = response()
    await stateHandler({
      method: 'GET',
      headers: { authorization: 'Bearer opaque' },
    } as never, readRes as never)
    expect(readRes.statusCode).toBe(200)
    expect(mocks.load).toHaveBeenCalledWith(USER_A)
  })

  it('rejects mutation ID reuse with a different payload', async () => {
    mocks.save.mockRejectedValue(new mocks.StateMutationConflict())
    const res = response()
    await stateHandler({
      method: 'PUT',
      headers: { authorization: 'Bearer opaque' },
      body: { state: stateFixture(), baseVersion: 4, mutationId: MUTATION_ID },
    } as never, res as never)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ error: 'Mutation ID was already used for a different write.' })
  })

  it('returns a generic 429 with coarse retry guidance', async () => {
    mocks.ipRateLimit.mockRejectedValue(new mocks.RateLimitExceeded())
    const res = response()
    await stateHandler({ method: 'GET', headers: {} } as never, res as never)

    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({ error: 'Too many requests. Try again later.' })
    expect(res.headers.get('retry-after')).toBe('60')
  })
})
