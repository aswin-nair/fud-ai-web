import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import { AccountProviderConflictError, upsertGoogleUser } from '../../api/_lib/users.js'

const EMAIL_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  external_sub: 'email:person@example.com',
  email: 'person@example.com',
  name: 'Email User',
  picture: null,
  provider: 'email',
  password_hash: 'hash',
  password_salt: 'salt',
}

describe('account provider boundaries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not auto-link a Google identity to an email account with the same address', async () => {
    db.sql
      .mockResolvedValueOnce([]) // no matching Google external subject
      .mockResolvedValueOnce([EMAIL_USER]) // address belongs to password account

    await expect(upsertGoogleUser({
      googleSub: 'google-subject-123',
      email: 'person@example.com',
      name: 'Google User',
    })).rejects.toBeInstanceOf(AccountProviderConflictError)

    expect(db.sql).toHaveBeenCalledTimes(2)
  })

  it('maps a concurrent unique-email race to the stable provider conflict', async () => {
    db.sql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(Object.assign(new Error('raw unique constraint'), { code: '23505' }))

    await expect(upsertGoogleUser({
      googleSub: 'google-subject-123',
      email: 'person@example.com',
      name: 'Google User',
    })).rejects.toBeInstanceOf(AccountProviderConflictError)
  })
})
