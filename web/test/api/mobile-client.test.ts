import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOBILE_AUTH_DISABLED_RESPONSE } from '../../api/_lib/cloudControl.js'
import {
  hasBrowserOrigin,
  readPresentedRefreshToken,
  resolveSessionTransport,
} from '../../api/_lib/mobileClient.js'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    login: vi.fn(),
    issue: vi.fn(),
    rotate: vi.fn(),
    sign: vi.fn(),
    rate: vi.fn(),
    RateLimitExceeded,
  }
})

vi.mock('../../api/_lib/users.js', () => ({
  loginEmailUser: mocks.login,
  InvalidCredentialsError: class InvalidCredentialsError extends Error {},
}))
vi.mock('../../api/_lib/authenticate.js', () => ({ issueSession: mocks.issue }))
vi.mock('../../api/_lib/sessions.js', () => ({
  rotateRefreshToken: mocks.rotate,
  RefreshReplayError: class RefreshReplayError extends Error {},
  RefreshNotFoundError: class RefreshNotFoundError extends Error {},
}))
vi.mock('../../api/_lib/jwt.js', () => ({ signSession: mocks.sign }))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rate,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import loginHandler from '../../api/auth/login.js'
import refreshHandler from '../../api/auth/refresh.js'

const USER = {
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'person@example.com',
  name: 'Person',
  provider: 'email' as const,
}

describe('mobile session transport', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    mocks.rate.mockResolvedValue(undefined)
    mocks.login.mockResolvedValue(USER)
    mocks.issue.mockResolvedValue({ token: 'opaque', user: USER })
    mocks.sign.mockResolvedValue('short-lived-access')
    mocks.rotate.mockResolvedValue({
      id: '10000000-0000-4000-8000-000000000001',
      familyId: '20000000-0000-4000-8000-000000000002',
      expiresAt: new Date('2026-09-19T00:00:00.000Z'),
      refreshToken: 'rotated-refresh',
      user: USER,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('treats an Origin header as a browser and never a mobile grant', () => {
    expect(hasBrowserOrigin({ headers: { origin: 'https://app.example' } })).toBe(true)
    expect(hasBrowserOrigin({ headers: { referer: 'https://app.example/app/login' } })).toBe(true)
    expect(hasBrowserOrigin({ headers: {} })).toBe(false)
  })

  it('keeps web logins on the cookie transport', () => {
    expect(resolveSessionTransport({ headers: {} }, { email: 'person@example.com' })).toBe('cookie')
  })

  it('refuses a mobile client while the flag is off', async () => {
    expect(resolveSessionTransport({ headers: {} }, { client: 'mobile' })).toBe('unavailable')
    const res = response()
    await loginHandler(request({
      method: 'POST',
      body: { email: 'person@example.com', password: 'long-enough-password', client: 'mobile' },
    }) as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(MOBILE_AUTH_DISABLED_RESPONSE)
    expect(mocks.login).not.toHaveBeenCalled()
    expect(mocks.issue).not.toHaveBeenCalled()
  })

  it('issues a cookie session when a browser origin asks for a mobile grant', async () => {
    vi.stubEnv('ENABLE_MOBILE_AUTH', 'true')
    expect(resolveSessionTransport(
      { headers: { origin: 'https://app.example' } },
      { client: 'mobile' },
    )).toBe('cookie')
    const res = response()
    await loginHandler(request({
      method: 'POST',
      headers: { origin: 'https://app.example' },
      body: { email: 'person@example.com', password: 'long-enough-password', client: 'mobile' },
    }) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(mocks.issue).toHaveBeenCalledWith(
      USER,
      expect.anything(),
      expect.anything(),
      'cookie',
    )
    expect(JSON.stringify(res.body)).not.toContain('refreshToken')
  })

  it('issues a mobile session only when the flag is on and no browser origin is present', async () => {
    vi.stubEnv('ENABLE_MOBILE_AUTH', 'true')
    mocks.issue.mockResolvedValue({
      token: 'opaque',
      user: USER,
      refreshToken: 'mobile-refresh-token',
    })
    const res = response()
    await loginHandler(request({
      method: 'POST',
      body: { email: 'person@example.com', password: 'long-enough-password', client: 'mobile' },
    }) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(mocks.issue).toHaveBeenCalledWith(
      USER,
      expect.anything(),
      expect.anything(),
      'mobile',
    )
    expect(res.body).toEqual({
      token: 'opaque',
      user: USER,
      refreshToken: 'mobile-refresh-token',
    })
    expect(res.headers.get('set-cookie')).toBeUndefined()
  })

  it('ignores a body refresh token from a browser origin', () => {
    expect(readPresentedRefreshToken(
      { headers: { origin: 'https://app.example' } },
      { client: 'mobile', refreshToken: 'body-refresh-token-value' },
    )).toBeNull()
  })

  it('rotates a native refresh token in the JSON body when mobile auth is enabled', async () => {
    vi.stubEnv('ENABLE_MOBILE_AUTH', 'true')
    const res = response()
    await refreshHandler(request({
      method: 'POST',
      body: { client: 'mobile', refreshToken: 'current-refresh-token' },
    }) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(mocks.rotate).toHaveBeenCalledWith('current-refresh-token')
    expect(res.body).toEqual({
      token: 'short-lived-access',
      user: USER,
      refreshToken: 'rotated-refresh',
    })
    expect(res.headers.get('set-cookie')).toBeUndefined()
  })
})
