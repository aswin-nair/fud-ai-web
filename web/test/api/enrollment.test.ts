import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  canPromoteCohort,
  evaluateEnrollment,
  evaluateRolloutHalt,
  rolloutCertification,
  ROLLOUT_THRESHOLDS,
} from '@fud-ai/contracts'
import { ACCOUNT_CREATION_DISABLED_RESPONSE, ENROLLMENT_CLOSED_RESPONSE } from '../../api/_lib/cloudControl.js'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  issue: vi.fn(),
  rate: vi.fn(),
  countUsers: vi.fn(),
  findBySub: vi.fn(),
  upsert: vi.fn(),
  verifyGoogleToken: vi.fn(),
}))

vi.mock('../../api/_lib/users.js', () => ({
  registerEmailUser: mocks.register,
  countUsers: mocks.countUsers,
  findUserByExternalSub: mocks.findBySub,
  upsertGoogleUser: mocks.upsert,
  DuplicateAccountError: class DuplicateAccountError extends Error {},
  AccountProviderConflictError: class AccountProviderConflictError extends Error {},
}))
vi.mock('../../api/_lib/authenticate.js', () => ({ issueSession: mocks.issue }))
vi.mock('../../api/_lib/rateLimit.js', () => ({
  enforceAuthRateLimit: mocks.rate,
  enforceAuthAccountRateLimit: mocks.rate,
  RateLimitExceeded: class RateLimitExceeded extends Error {
    retryAfterSeconds = 60
  },
}))
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {
    verifyIdToken = mocks.verifyGoogleToken
  },
}))

import registerHandler from '../../api/auth/register.js'
import googleHandler from '../../api/auth/google.js'

function inviteHash(email: string, pepper = '') {
  return createHash('sha256').update(`${pepper}\n${email}`).digest('hex')
}

describe('rollout contract', () => {
  it('does not claim dogfood has started', () => {
    expect(rolloutCertification()).toEqual({ certified: false, dogfoodStarted: false })
  })

  it('keeps open registration when no cohort program is configured', () => {
    expect(evaluateEnrollment({
      cohort: null,
      inviteConfigured: false,
      invited: false,
      accountCount: 0,
    })).toEqual({ ok: true })
  })

  it('fail-closes invite cohorts without hashes and rejects unknown emails', () => {
    expect(evaluateEnrollment({
      cohort: 'internal',
      inviteConfigured: false,
      invited: false,
      accountCount: 0,
    })).toEqual({ ok: false, reason: 'invite_not_configured' })
    expect(evaluateEnrollment({
      cohort: 'invite',
      inviteConfigured: true,
      invited: false,
      accountCount: 12,
    })).toEqual({ ok: false, reason: 'not_invited' })
  })

  it('stops enrollment at the cohort cap and refuses skipped public steps', () => {
    expect(evaluateEnrollment({
      cohort: 'internal',
      inviteConfigured: true,
      invited: true,
      accountCount: 30,
    })).toEqual({ ok: false, reason: 'cohort_full' })
    expect(canPromoteCohort('internal', 'public-5', { reviewRecorded: true, haltReasons: [] })).toEqual({
      ok: false,
      reason: 'invalid_step',
    })
    expect(canPromoteCohort('invite', 'public-5', { reviewRecorded: true, haltReasons: [] })).toEqual({ ok: true })
    expect(canPromoteCohort('public-5', 'public-25', { reviewRecorded: false, haltReasons: [] })).toEqual({
      ok: false,
      reason: 'review_required',
    })
  })

  it('halts on stop-the-line incidents and threshold misses', () => {
    expect(evaluateRolloutHalt({
      crossAccountWrite: true,
      lostAcceptedEntry: true,
      secretSync: true,
      failedDeletion: true,
      unsafeTargetBypass: true,
      managedAiInvoked: true,
    })).toEqual([
      'cross-account-write',
      'lost-accepted-entry',
      'secret-sync',
      'failed-deletion',
      'unsafe-target-bypass',
      'managed-ai-invoked',
    ])
    expect(evaluateRolloutHalt({
      onboardingCompletion: ROLLOUT_THRESHOLDS.onboardingCompletion - 0.01,
      crashFreeRate: 0.997,
      persistenceRate: 0.999,
    })).toEqual([
      'onboarding-completion',
      'crash-free',
      'accepted-entry-persistence',
    ])
  })
})

describe('account enrollment controls', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'postgres://configured.example/test')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'google-client-id')
    mocks.rate.mockResolvedValue(undefined)
    mocks.issue.mockResolvedValue({ token: 'opaque', user: { sub: 'user-id' } })
    mocks.register.mockResolvedValue({ sub: 'user-id' })
    mocks.countUsers.mockResolvedValue(0)
    mocks.findBySub.mockResolvedValue(null)
    mocks.upsert.mockResolvedValue({ sub: 'user-id' })
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

  it('stops email registration when account creation is disabled', async () => {
    vi.stubEnv('ENABLE_ACCOUNT_CREATION', 'false')
    const res = response()
    await registerHandler(request({
      method: 'POST',
      body: { name: 'Person', email: 'person@example.com', password: 'long-enough-password' },
    }) as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(ACCOUNT_CREATION_DISABLED_RESPONSE)
    expect(mocks.register).not.toHaveBeenCalled()
    expect(JSON.stringify(res.body)).not.toContain('person@example.com')
  })

  it('rejects an uninvited address without echoing the email', async () => {
    vi.stubEnv('BETA_COHORT', 'internal')
    vi.stubEnv('BETA_INVITE_HASHES', inviteHash('allowed@example.com'))
    const res = response()
    await registerHandler(request({
      method: 'POST',
      body: { name: 'Person', email: 'other@example.com', password: 'long-enough-password' },
    }) as never, res as never)
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual(ENROLLMENT_CLOSED_RESPONSE)
    expect(mocks.register).not.toHaveBeenCalled()
    expect(JSON.stringify(res.body)).not.toContain('other@example.com')
  })

  it('allows an invited address under the internal cap', async () => {
    vi.stubEnv('BETA_COHORT', 'internal')
    vi.stubEnv('BETA_INVITE_HASHES', inviteHash('allowed@example.com'))
    mocks.countUsers.mockResolvedValue(4)
    const res = response()
    await registerHandler(request({
      method: 'POST',
      body: { name: 'Person', email: 'allowed@example.com', password: 'long-enough-password' },
    }) as never, res as never)
    expect(res.statusCode).toBe(201)
    expect(mocks.register).toHaveBeenCalled()
  })

  it('lets an existing Google session through when enrollment is closed', async () => {
    vi.stubEnv('ENABLE_ACCOUNT_CREATION', 'false')
    mocks.findBySub.mockResolvedValue({ id: 'user-id' })
    const res = response()
    await googleHandler(request({
      method: 'POST',
      body: { credential: 'valid-google-credential' },
    }) as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(mocks.upsert).toHaveBeenCalled()
  })
})
