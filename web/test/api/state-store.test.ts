import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import {
  saveUserState,
  stateMutationHash,
  StateMutationConflict,
  StateVersionConflict,
} from '../../api/_lib/state.js'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const MUTATION_ID = '10000000-0000-4000-8000-000000000001'

describe('idempotent state store', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hashes equivalent object key order identically and includes baseVersion', () => {
    expect(stateMutationHash({ nested: { b: 2, a: 1 }, z: true }, 4)).toBe(
      stateMutationHash({ z: true, nested: { a: 1, b: 2 } }, 4),
    )
    expect(stateMutationHash({ z: true }, 4)).not.toBe(stateMutationHash({ z: true }, 5))
  })

  it('returns the ledger version for a replay without inventing a new version', async () => {
    db.sql.mockResolvedValue([{ outcome: 'replayed', resulting_version: '8' }])
    await expect(saveUserState(USER_ID, { ok: true }, 7, MUTATION_ID)).resolves.toEqual({
      version: 8,
      replayed: true,
    })
    expect(db.sql).toHaveBeenCalledTimes(1)
  })

  it('distinguishes stale versions from conflicting mutation reuse', async () => {
    db.sql.mockResolvedValueOnce([{ outcome: 'version_conflict', resulting_version: null }])
    await expect(saveUserState(USER_ID, { ok: true }, 7, MUTATION_ID))
      .rejects.toBeInstanceOf(StateVersionConflict)

    db.sql.mockResolvedValueOnce([{ outcome: 'mutation_conflict', resulting_version: '8' }])
    await expect(saveUserState(USER_ID, { ok: false }, 7, MUTATION_ID))
      .rejects.toBeInstanceOf(StateMutationConflict)
  })
})
