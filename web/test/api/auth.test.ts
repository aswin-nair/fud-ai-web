import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class InvalidCredentialsError extends Error {}
  class DuplicateAccountError extends Error {}
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    login: vi.fn(),
    register: vi.fn(),
    issue: vi.fn(),
    rate: vi.fn(),
    InvalidCredentialsError,
    DuplicateAccountError,
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/users.js', () => ({
  loginEmailUser: mocks.login,
  registerEmailUser: mocks.register,
  countUsers: async () => 0,
  InvalidCredentialsError: mocks.InvalidCredentialsError,
  DuplicateAccountError: mocks.DuplicateAccountError,
}))
vi.mock('../../api/_lib/authenticate.js', () => ({ issueSession: mocks.issue }))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import loginHandler from '../../api/auth/login.js'
import registerHandler from '../../api/auth/register.js'

describe('authentication boundary hardening', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.issue.mockResolvedValue({ token: 'opaque', user: { sub: 'user-id' } })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses one generic response for unknown users and wrong passwords', async () => {
    for (const internalMessage of ['unknown user', 'wrong password']) {
      mocks.login.mockRejectedValueOnce(
        Object.assign(new mocks.InvalidCredentialsError(), { message: internalMessage }),
      )
      const res = response()
      await loginHandler({
        method: 'POST',
        headers: {},
        socket: { remoteAddress: '203.0.113.1' },
        body: { email: 'person@example.com', password: 'wrong-password' },
      } as never, res as never)
      expect(res.statusCode).toBe(401)
      expect(res.body).toEqual({ error: 'Invalid email or password' })
    }
  })

  it('returns a generic 429 without disclosing the limiting bucket', async () => {
    mocks.rate.mockRejectedValue(new mocks.RateLimitExceeded())
    const res = response()
    await loginHandler({
      method: 'POST',
      headers: {},
      body: { email: 'person@example.com', password: 'wrong-password' },
    } as never, res as never)
    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({ error: 'Too many requests. Try again later.' })
    expect(JSON.stringify(res.body)).not.toContain('account')
    expect(JSON.stringify(res.body)).not.toContain('IP')
  })

  it('does not echo an existing email address from registration conflicts', async () => {
    mocks.register.mockRejectedValue(new mocks.DuplicateAccountError())
    const res = response()
    await registerHandler({
      method: 'POST',
      headers: {},
      body: { name: 'Person', email: 'private@example.com', password: 'long-enough-password' },
    } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Unable to create account with those details' })
    expect(JSON.stringify(res.body)).not.toContain('private@example.com')
  })
})
