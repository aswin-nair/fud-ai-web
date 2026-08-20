import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class InvalidCredentialsError extends Error {}
  class InvalidSessionError extends Error {}
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    authenticate: vi.fn(),
    change: vi.fn(),
    revoke: vi.fn(),
    issue: vi.fn(),
    rate: vi.fn(),
    InvalidCredentialsError,
    InvalidSessionError,
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/authenticate.js', () => ({
  authenticateRequest: mocks.authenticate,
  issueSession: mocks.issue,
}))
vi.mock('../../api/_lib/users.js', () => ({
  changeEmailPassword: mocks.change,
  InvalidCredentialsError: mocks.InvalidCredentialsError,
}))
vi.mock('../../api/_lib/sessions.js', () => ({
  revokeAllSessions: mocks.revoke,
}))
vi.mock('../../api/_lib/jwt.js', () => ({
  InvalidSessionError: mocks.InvalidSessionError,
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAccountIpRateLimit: mocks.rate,
  enforceAccountUserRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import changeHandler from '../../api/auth/change-password.js'

const USER = {
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'person@example.com',
  name: 'Person',
  provider: 'email' as const,
}

describe('change-password', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.authenticate.mockResolvedValue({ sub: USER.sub, sessionId: '10000000-0000-4000-8000-000000000001' })
    mocks.change.mockResolvedValue(USER)
    mocks.revoke.mockResolvedValue(undefined)
    mocks.issue.mockResolvedValue({ token: 'short-lived-access', user: USER })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('revokes every session and issues a new one after a correct current password', async () => {
    const res = response()
    await changeHandler(request({
      method: 'POST',
      headers: { authorization: 'Bearer opaque' },
      body: { currentPassword: 'old-password-1', newPassword: 'new-password-1' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ token: 'short-lived-access', user: USER })
    expect(mocks.revoke).toHaveBeenCalledWith(USER.sub)
    expect(mocks.issue).toHaveBeenCalled()
    expect(mocks.revoke.mock.invocationCallOrder[0]).toBeLessThan(mocks.issue.mock.invocationCallOrder[0])
  })

  it('does not reveal whether the current password failed or the session is gone', async () => {
    mocks.change.mockRejectedValue(new mocks.InvalidCredentialsError())
    const wrong = response()
    await changeHandler(request({
      method: 'POST',
      body: { currentPassword: 'wrong-password', newPassword: 'new-password-1' },
    }) as never, wrong as never)
    expect(wrong.statusCode).toBe(401)
    expect(wrong.body).toEqual({ error: 'Current password is incorrect' })
    expect(mocks.revoke).not.toHaveBeenCalled()
    expect(mocks.issue).not.toHaveBeenCalled()
  })
})
