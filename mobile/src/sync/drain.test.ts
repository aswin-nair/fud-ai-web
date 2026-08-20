import { describe, expect, it } from 'vitest'

import { CONTRACT_VERSION } from '@fud-ai/contracts'

import { drainOnce } from './drain'

const DEVICE = 'device-alpha-1'
const MUTATION = '10000000-0000-4000-8000-000000000001'

const entity = {
  contractVersion: CONTRACT_VERSION,
  entityType: 'food_entry' as const,
  entityId: 'meal-7',
  deviceId: DEVICE,
  localDate: '2026-10-31',
  timeZone: 'America/Los_Angeles',
  createdAt: '2026-11-01T06:30:00.000Z',
  updatedAt: '2026-11-01T06:30:00.000Z',
  deletedAt: null,
  recordVersion: 1,
  payload: { name: 'Oats', calories: 250, protein: 8, carbs: 40, fat: 5, source: 'manual', mealType: 'breakfast' },
}

describe('outbox drain', () => {
  it('does not post while sync is disabled', async () => {
    let called = false
    const result = await drainOnce({
      syncEnabled: false,
      accessToken: 'opaque',
      now: new Date('2026-08-20T12:00:00.000Z'),
      rows: [{
        mutationId: MUTATION,
        userId: '00000000-0000-4000-8000-000000000001',
        status: 'pending',
        entityJson: JSON.stringify(entity),
        nextAttemptAt: '2026-08-20T11:00:00.000Z',
        attemptCount: 0,
      }],
      transport: {
        postMutations: async () => {
          called = true
          return { status: 200, body: { acks: [] } }
        },
      },
    })
    expect(result).toEqual({ action: 'skip', reason: 'sync-disabled' })
    expect(called).toBe(false)
  })

  it('stops on 401 and surfaces the mutation id', async () => {
    const result = await drainOnce({
      syncEnabled: true,
      accessToken: 'opaque',
      now: new Date('2026-08-20T12:00:00.000Z'),
      rows: [{
        mutationId: MUTATION,
        userId: '00000000-0000-4000-8000-000000000001',
        status: 'pending',
        entityJson: JSON.stringify(entity),
        nextAttemptAt: '2026-08-20T11:00:00.000Z',
        attemptCount: 0,
      }],
      transport: {
        postMutations: async () => ({ status: 401, body: { error: 'Unauthorized' } }),
      },
    })
    expect(result).toEqual({ action: 'auth', mutationId: MUTATION })
  })
})
