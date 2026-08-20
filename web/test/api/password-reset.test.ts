import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import {
  consumePasswordResetToken,
  generatePasswordResetToken,
} from '../../api/_lib/passwordReset.js'

describe('password reset primitives', () => {
  afterEach(() => vi.clearAllMocks())

  it('creates random 256-bit tokens and stores a one-way hash representation', () => {
    const first = generatePasswordResetToken()
    const second = generatePasswordResetToken()
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(first.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(first.tokenHash).not.toContain(first.token)
    expect(second.token).not.toBe(first.token)
  })

  it('never sends the raw reset token to the database during consumption', async () => {
    const rawToken = 'a-raw-reset-token-that-must-not-be-persisted'
    db.sql.mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000001' }])
    await expect(consumePasswordResetToken(rawToken, 'a-valid-new-password'))
      .resolves.toBe(true)

    expect(JSON.stringify(db.sql.mock.calls)).not.toContain(rawToken)
    const query = (db.sql.mock.calls[0][0] as readonly string[]).join(' ')
    expect(query).toContain('reset.consumed_at IS NULL')
    expect(query).toContain('reset.expires_at > NOW()')
    expect(query).toContain('UPDATE auth_sessions')
  })

  it('documents that public recovery is blocked on a verified email provider', () => {
    const notes = readFileSync(new URL('../../api/README.md', import.meta.url), 'utf8')
    expect(notes).toMatch(/no public reset\s+request endpoint/)
    expect(notes).toContain('transactional-email provider')
    expect(notes).toMatch(/never logs\s+the token/)
  })
})
