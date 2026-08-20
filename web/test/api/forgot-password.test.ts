import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    find: vi.fn(),
    create: vi.fn(),
    send: vi.fn(),
    configured: vi.fn(),
    resetUrl: vi.fn(),
    rate: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/users.js', () => ({
  findUserByEmail: mocks.find,
}))
vi.mock('../../api/_lib/passwordReset.js', () => ({
  createPasswordResetToken: mocks.create,
}))
vi.mock('../../api/_lib/mailer.js', () => ({
  isMailerConfigured: mocks.configured,
  passwordResetUrl: mocks.resetUrl,
  sendPasswordResetEmail: mocks.send,
}))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import forgotHandler from '../../api/_auth/forgot-password.js'

describe('forgot-password non-enumeration', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.configured.mockReturnValue(true)
    mocks.resetUrl.mockReturnValue('https://app.example/app/reset-password?token=raw-token')
    mocks.create.mockResolvedValue({ token: 'raw-token', expiresAt: new Date() })
    mocks.send.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    spy.mockClear()
  })

  it('returns the same body for unknown and known addresses', async () => {
    mocks.find.mockResolvedValueOnce(null)
    const unknown = response()
    await forgotHandler(request({
      method: 'POST',
      body: { email: 'missing@example.com' },
    }) as never, unknown as never)

    mocks.find.mockResolvedValueOnce({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'person@example.com',
      provider: 'email',
    })
    const known = response()
    await forgotHandler(request({
      method: 'POST',
      body: { email: 'person@example.com' },
    }) as never, known as never)

    expect(unknown.statusCode).toBe(200)
    expect(known.statusCode).toBe(200)
    expect(unknown.body).toEqual({ ok: true })
    expect(known.body).toEqual(unknown.body)
    expect(JSON.stringify(unknown.body)).not.toContain('missing@example.com')
    expect(JSON.stringify(known.body)).not.toContain('person@example.com')
    expect(JSON.stringify(spy.mock.calls)).not.toContain('raw-token')
    expect(JSON.stringify(spy.mock.calls)).not.toContain('person@example.com')
  })

  it('does not create or send a token when the mailer is unconfigured', async () => {
    mocks.configured.mockReturnValue(false)
    mocks.find.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'person@example.com',
      provider: 'email',
    })
    const res = response()
    await forgotHandler(request({
      method: 'POST',
      body: { email: 'person@example.com' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.send).not.toHaveBeenCalled()
  })
})
