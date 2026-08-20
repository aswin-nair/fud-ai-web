import { describe, expect, it } from 'vitest'

import { decideDrain, interpretSyncStatus, nextBackoffSeconds, outboxEntityContainsSecret } from './outboxPolicy'
import { mealEntryToMutation } from './projectMeal'

const USER = '00000000-0000-4000-8000-000000000001'
const DEVICE = 'device-alpha-1'
const NOW = new Date('2026-08-20T12:00:00.000Z')

function row(overrides: Partial<Parameters<typeof decideDrain>[0]['rows'][number]> = {}) {
  return {
    mutationId: '10000000-0000-4000-8000-000000000001',
    userId: USER,
    status: 'pending' as const,
    entityJson: JSON.stringify({ payload: { name: 'Oats', calories: 250 } }),
    nextAttemptAt: '2026-08-20T11:00:00.000Z',
    attemptCount: 0,
    ...overrides,
  }
}

describe('mobile outbox policy', () => {
  it('does not upload while entity sync is disabled', () => {
    expect(decideDrain({
      syncEnabled: false,
      accessToken: 'opaque',
      now: NOW,
      rows: [row()],
    })).toEqual({ action: 'skip', reason: 'sync-disabled' })
  })

  it('stops on authorization failure and does not continue the queue', () => {
    expect(decideDrain({
      syncEnabled: true,
      accessToken: 'opaque',
      now: NOW,
      rows: [row({ status: 'auth_failed' }), row({ mutationId: '10000000-0000-4000-8000-000000000002' })],
    })).toEqual({ action: 'skip', reason: 'auth-failed' })
  })

  it('uploads due pending rows in order and waits during backoff', () => {
    expect(decideDrain({
      syncEnabled: true,
      accessToken: 'opaque',
      now: NOW,
      rows: [row(), row({
        mutationId: '10000000-0000-4000-8000-000000000002',
        nextAttemptAt: '2026-08-20T13:00:00.000Z',
      })],
    })).toEqual({ action: 'upload', rows: [row()] })

    expect(decideDrain({
      syncEnabled: true,
      accessToken: 'opaque',
      now: NOW,
      rows: [row({ nextAttemptAt: '2026-08-20T13:00:00.000Z' })],
    })).toEqual({ action: 'skip', reason: 'backoff' })
  })

  it('rejects secret-bearing entity JSON and grows backoff', () => {
    expect(outboxEntityContainsSecret(JSON.stringify({ payload: { apiKey: 'sk-secret' } }))).toBe(true)
    expect(nextBackoffSeconds(0)).toBe(1)
    expect(nextBackoffSeconds(8)).toBe(256)
    expect(nextBackoffSeconds(9)).toBe(300)
    expect(interpretSyncStatus(401)).toBe('auth')
    expect(interpretSyncStatus(409)).toBe('conflict')
    expect(interpretSyncStatus(503)).toBe('disabled')
  })

  it('projects a meal onto the stored local date, not a rebuilt travel day', () => {
    const mutation = mealEntryToMutation({
      entry: {
        id: 7,
        customName: 'Oats',
        kcal: 250,
        proteinG: 8,
        carbsG: 40,
        fatG: 5,
        mealSlot: 'breakfast',
        loggedAtUtc: '2026-11-01T06:30:00.000Z',
        localDate: '2026-10-31',
      },
      userId: USER,
      deviceId: DEVICE,
      timeZone: 'America/Los_Angeles',
      mutationId: '10000000-0000-4000-8000-000000000001',
      baseCursor: 0,
    })
    expect(mutation?.entity).toMatchObject({
      entityType: 'food_entry',
      entityId: 'meal-7',
      localDate: '2026-10-31',
    })
    if (mutation?.kind === 'upsert' && 'payload' in mutation.entity) {
      expect(mutation.entity.payload).not.toHaveProperty('apiKey')
    }
  })
})
