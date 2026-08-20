import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sessions = vi.hoisted(() => ({
  active: vi.fn(),
  create: vi.fn(),
}))

vi.mock('../../api/_lib/sessions.js', () => ({
  isSessionActive: sessions.active,
  createSession: sessions.create,
}))

import { authenticateRequest } from '../../api/_lib/authenticate.js'
import { InvalidSessionError, signSession, verifySession } from '../../api/_lib/jwt.js'

const USER = {
  sub: '00000000-0000-4000-8000-000000000001',
  email: 'person@example.com',
  name: 'Test Person',
  provider: 'email' as const,
}
const SESSION_ID = '10000000-0000-4000-8000-000000000001'

describe('database-backed sessions', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'session-tests-secret-at-least-32-characters-long')
    sessions.active.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('binds the signed subject to the session record lookup', async () => {
    const token = await signSession(USER, SESSION_ID)
    const claims = await authenticateRequest({
      headers: { authorization: `Bearer ${token}` },
    } as never)

    expect(claims.sub).toBe(USER.sub)
    expect(claims.sessionId).toBe(SESSION_ID)
    expect(sessions.active).toHaveBeenCalledWith(USER.sub, SESSION_ID)
  })

  it('rejects a validly signed but revoked session', async () => {
    sessions.active.mockResolvedValue(false)
    const token = await signSession(USER, SESSION_ID)
    await expect(authenticateRequest({
      headers: { authorization: `Bearer ${token}` },
    } as never)).rejects.toBeInstanceOf(InvalidSessionError)
  })

  it('rejects an expired token before consulting the session table', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const token = await signSession(USER, SESSION_ID, new Date('2026-01-02T00:00:00.000Z'))
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))

    await expect(authenticateRequest({
      headers: { authorization: `Bearer ${token}` },
    } as never)).rejects.toBeInstanceOf(InvalidSessionError)
    expect(sessions.active).not.toHaveBeenCalled()
  })

  it('rejects a token whose signature was changed', async () => {
    const token = await signSession(USER, SESSION_ID)
    const [header, payload, signature] = token.split('.')
    const replacement = signature[0] === 'a' ? 'b' : 'a'
    const tampered = `${header}.${payload}.${replacement}${signature.slice(1)}`
    await expect(verifySession(tampered)).rejects.toBeInstanceOf(InvalidSessionError)
  })
})
