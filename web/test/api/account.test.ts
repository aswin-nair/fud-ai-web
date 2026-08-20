import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    authenticate: vi.fn(),
    rateLimit: vi.fn(),
    deleteAccount: vi.fn(),
    revokeAll: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/authenticate.js', () => ({ authenticateRequest: mocks.authenticate }))
vi.mock('../../api/_lib/accounts.js', () => ({ deleteUserAccount: mocks.deleteAccount }))
vi.mock('../../api/_lib/sessions.js', () => ({ revokeAllSessions: mocks.revokeAll }))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAccountIpRateLimit: mocks.rateLimit,
  enforceAccountUserRateLimit: mocks.rateLimit,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import accountHandler from '../../api/account.js'
import logoutAllHandler from '../../api/_auth/logout-all.js'

const USER_A = '00000000-0000-4000-8000-000000000001'
const USER_B = '00000000-0000-4000-8000-000000000002'

describe('account deletion and session revocation', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.authenticate.mockResolvedValue({
      sub: USER_A,
      sessionId: '10000000-0000-4000-8000-000000000001',
    })
    mocks.rateLimit.mockResolvedValue(undefined)
    mocks.deleteAccount.mockResolvedValue(true)
    mocks.revokeAll.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('deletes only the authenticated account and ignores a supplied user ID', async () => {
    const res = response()
    await accountHandler({
      method: 'DELETE',
      headers: { authorization: 'Bearer opaque' },
      body: { confirmation: 'DELETE', userId: USER_B },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mocks.deleteAccount).toHaveBeenCalledWith(USER_A)
    expect(mocks.deleteAccount).not.toHaveBeenCalledWith(USER_B)
  })

  it('requires an explicit destructive confirmation', async () => {
    const res = response()
    await accountHandler({
      method: 'DELETE',
      headers: { authorization: 'Bearer opaque' },
      body: { confirmation: 'delete' },
    } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })

  it('includes deletion in the cloud-write incident kill switch', async () => {
    vi.stubEnv('ENABLE_CLOUD_WRITES', 'false')
    const res = response()
    await accountHandler({
      method: 'DELETE',
      headers: { authorization: 'Bearer opaque' },
      body: { confirmation: 'DELETE' },
    } as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })

  it('revokes every session for the authenticated user', async () => {
    const res = response()
    await logoutAllHandler({
      method: 'POST',
      headers: { authorization: 'Bearer opaque' },
    } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(mocks.revokeAll).toHaveBeenCalledWith(USER_A)
  })
})
