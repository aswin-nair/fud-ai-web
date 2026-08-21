import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    consume: vi.fn(),
    rate: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/passwordReset.js', () => ({
  consumePasswordResetToken: mocks.consume,
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))
vi.mock('../../api/_lib/ensureAuthSchema.js', () => ({
  prepareAuth: async () => true,
}))

import resetHandler from '../../api/_auth/reset-password.js'

describe('reset-password', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.consume.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    spy.mockClear()
  })

  it('returns the same invalid-or-expired body without echoing the token', async () => {
    mocks.consume.mockResolvedValue(false)
    const res = response()
    await resetHandler(request({
      method: 'POST',
      body: { token: 'one-time-reset-token', password: 'new-password-1' },
    }) as never, res as never)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'This reset link is invalid or has expired.' })
    expect(JSON.stringify(res.body)).not.toContain('one-time-reset-token')
    expect(JSON.stringify(spy.mock.calls)).not.toContain('one-time-reset-token')
  })

  it('does not include a session token after a successful reset', async () => {
    const res = response()
    await resetHandler(request({
      method: 'POST',
      body: { token: 'one-time-reset-token', password: 'new-password-1' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(JSON.stringify(res.body)).not.toContain('token')
  })
})
