import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import { isSessionActive, revokeSession } from '../../api/_lib/sessions.js'

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

  it('scopes individual revocation to both account and session IDs', async () => {
    db.sql.mockResolvedValue([])
    await revokeSession(USER, SESSION)
    const [, ...values] = db.sql.mock.calls[0]
    expect(values).toContain(USER)
    expect(values).toContain(SESSION)
  })
})
