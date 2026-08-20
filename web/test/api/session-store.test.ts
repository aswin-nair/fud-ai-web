import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import {
  createSession,
  hashRefreshToken,
  isSessionActive,
  RefreshReplayError,
  revokeSession,
  rotateRefreshToken,
} from '../../api/_lib/sessions.js'

const USER = '00000000-0000-4000-8000-000000000001'
const SESSION = '10000000-0000-4000-8000-000000000001'

describe('session record store', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires a matching user/session pair that is unrevoked and unexpired', async () => {
    db.sql.mockResolvedValue([{ active: true }])
    await expect(isSessionActive(USER, SESSION)).resolves.toBe(true)

    const [template, ...values] = db.sql.mock.calls[0]
    const query = (template as readonly string[]).join(' ')
    expect(query).toContain('revoked_at IS NULL')
    expect(query).toContain('expires_at > NOW()')
    expect(values).toContain(USER)
    expect(values).toContain(SESSION)
  })

  it('stores a refresh hash and never the raw rotating token', async () => {
    db.sql.mockResolvedValue([])
    const created = await createSession(USER)
    expect(created.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(JSON.stringify(db.sql.mock.calls)).not.toContain(created.refreshToken)
    const query = (db.sql.mock.calls[0][0] as readonly string[]).join(' ')
    expect(query).toContain('refresh_token_hash')
    expect(query).toContain('family_id')
  })

  it('scopes individual revocation to both account and session IDs', async () => {
    db.sql.mockResolvedValue([])
    await revokeSession(USER, SESSION)
    const [, ...values] = db.sql.mock.calls[0]
    expect(values).toContain(USER)
    expect(values).toContain(SESSION)
  })

  it('revokes the family when a replaced refresh token is replayed', async () => {
    const presented = 'replaced-refresh-token'
    const familyId = '20000000-0000-4000-8000-000000000002'
    db.sql
      .mockResolvedValueOnce([{
        id: SESSION,
        family_id: familyId,
        refresh_token_hash: 'current-hash',
        previous_refresh_token_hash: hashRefreshToken(presented),
        expires_at: '2026-09-19T00:00:00.000Z',
        revoked_at: null,
        user_id: USER,
        email: 'person@example.com',
        name: 'Person',
        picture: null,
        provider: 'email',
      }])
      .mockResolvedValueOnce([])

    await expect(rotateRefreshToken(presented)).rejects.toBeInstanceOf(RefreshReplayError)
    expect(JSON.stringify(db.sql.mock.calls)).not.toContain(presented)
    const revokeQuery = (db.sql.mock.calls[1][0] as readonly string[]).join(' ')
    expect(revokeQuery).toContain('family_id')
    expect(db.sql.mock.calls[1].slice(1)).toContain(familyId)
  })
})
