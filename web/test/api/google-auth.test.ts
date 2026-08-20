import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { response } from './helpers.js'

const mocks = vi.hoisted(() => {
  class AccountProviderConflictError extends Error {}
  class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  }
  return {
    verifyGoogleToken: vi.fn(),
    upsert: vi.fn(),
    findBySub: vi.fn(),
    issue: vi.fn(),
    rateIp: vi.fn(),
    rateAccount: vi.fn(),
    AccountProviderConflictError,
    RateLimitExceeded,
  }
})

vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = mocks.verifyGoogleToken
  },
}))
vi.mock('../../api/_lib/users.js', () => ({
  upsertGoogleUser: mocks.upsert,
  findUserByExternalSub: mocks.findBySub,
  countUsers: async () => 0,
  AccountProviderConflictError: mocks.AccountProviderConflictError,
}))
vi.mock('../../api/_lib/authenticate.js', () => ({ issueSession: mocks.issue }))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rateIp,
  enforceAuthAccountRateLimit: mocks.rateAccount,
  RateLimitExceeded: mocks.RateLimitExceeded,
}))

import googleHandler from '../../api/_auth/google.js'

describe('Google account provider collisions', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id')
    mocks.rateIp.mockResolvedValue(undefined)
    mocks.rateAccount.mockResolvedValue(undefined)
    mocks.findBySub.mockResolvedValue(null)
    mocks.verifyGoogleToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-subject',
        email: 'person@example.com',
        email_verified: true,
        name: 'Person',
      }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns a stable conflict instead of auto-linking or exposing a DB error', async () => {
    mocks.upsert.mockRejectedValue(new mocks.AccountProviderConflictError())
    const res = response()
    await googleHandler({
      method: 'POST',
      headers: {},
      body: { credential: 'valid-google-credential' },
    } as never, res as never)

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({
      error: 'An account already exists with a different sign-in method.',
    })
  })

  it('does not accept an unverified Google email claim', async () => {
    mocks.verifyGoogleToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-subject',
        email: 'person@example.com',
        email_verified: false,
      }),
    })
    const res = response()
    await googleHandler({
      method: 'POST',
      headers: {},
      body: { credential: 'google-credential' },
    } as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it('redacts invalid Google credential details behind one 401 response', async () => {
    mocks.verifyGoogleToken.mockRejectedValue(new Error('raw provider verification detail'))
    const res = response()
    await googleHandler({
      method: 'POST',
      headers: {},
      body: { credential: 'invalid-google-credential' },
    } as never, res as never)
    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Unable to sign in' })
    expect(JSON.stringify(res.body)).not.toContain('raw provider')
  })
})
