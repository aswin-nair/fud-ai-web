import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTRACT_VERSION } from '@fud-ai/contracts'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import { applyEntityMutation, entityMutationHash } from '../../api/_lib/entities.js'

const USER = '00000000-0000-4000-8000-000000000001'
const MUTATION = '10000000-0000-4000-8000-000000000001'

const mutation = {
  contractVersion: 1 as const,
  mutationId: MUTATION,
  deviceId: 'device-alpha-1',
  baseCursor: 0,
  kind: 'upsert' as const,
  entity: {
    contractVersion: CONTRACT_VERSION,
    entityType: 'food_entry' as const,
    entityId: 'food-entry-1',
    deviceId: 'device-alpha-1',
    localDate: '2026-10-31',
    timeZone: 'America/Los_Angeles',
    createdAt: '2026-11-01T06:30:00.000Z',
    updatedAt: '2026-11-01T06:30:00.000Z',
    deletedAt: null,
    recordVersion: 1,
    payload: { name: 'Oats', calories: 250 },
  },
}

describe('entity mutation store', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the hashed mutation and never the raw payload identity as the ledger key', async () => {
    db.sql.mockResolvedValue([{ outcome: 'saved', resulting_cursor: 1 }])
    await expect(applyEntityMutation(USER, mutation)).resolves.toEqual({
      mutationId: MUTATION,
      cursor: 1,
      replayed: false,
    })
    const query = (db.sql.mock.calls[0][0] as readonly string[]).join(' ')
    const hash = entityMutationHash(mutation)
    expect(query).toContain('apply_entity_mutation')
    expect(db.sql.mock.calls[0]).toContain(hash)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain('Oats')
  })

  it('replays the same mutation ID without treating it as a new write', async () => {
    db.sql.mockResolvedValue([{ outcome: 'replayed', resulting_cursor: 4 }])
    await expect(applyEntityMutation(USER, mutation)).resolves.toEqual({
      mutationId: MUTATION,
      cursor: 4,
      replayed: true,
    })
  })
})
