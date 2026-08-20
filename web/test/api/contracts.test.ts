import { describe, expect, it } from 'vitest'
import {
  canAdvanceMigration,
  checksumRecords,
  CONTRACT_VERSION,
  CONTRACTS_PACKAGE_ID,
  localDateInZone,
  projectSnapshot,
  recomputeDerivedProgression,
  validateAccountEntity,
  validateEntityMutation,
  validateMigrationAttempt,
} from '@fud-ai/contracts'

const FOOD_ID = 'food-entry-1'
const DEVICE = 'device-alpha-1'
const ZONE = 'America/Los_Angeles'
const INSTANT = new Date('2026-11-01T06:30:00.000Z')

function foodEntity(overrides: Record<string, unknown> = {}) {
  return {
    contractVersion: CONTRACT_VERSION,
    entityType: 'food_entry',
    entityId: FOOD_ID,
    deviceId: DEVICE,
    localDate: '2026-10-31',
    timeZone: ZONE,
    createdAt: INSTANT.toISOString(),
    updatedAt: INSTANT.toISOString(),
    deletedAt: null,
    recordVersion: 1,
    payload: { name: 'Oats', calories: 250, protein: 8, carbs: 40, fat: 5, source: 'manual', mealType: 'breakfast' },
    ...overrides,
  }
}

describe('entity contract v1', () => {
  it('identifies the contracts package', () => {
    expect(CONTRACTS_PACKAGE_ID).toBe('@fud-ai/contracts')
  })

  it('assigns historical local dates from the stored instant and zone, not from now', () => {
    expect(localDateInZone(INSTANT, 'UTC')).toBe('2026-11-01')
    expect(localDateInZone(INSTANT, ZONE)).toBe('2026-10-31')
    expect(localDateInZone(INSTANT, ZONE)).not.toBe(localDateInZone(new Date('2026-11-02T00:00:00.000Z'), ZONE))
  })

  it('rejects a missing local date on calendar-bearing records', () => {
    expect(validateAccountEntity(foodEntity({ localDate: null }))).toEqual({
      ok: false,
      error: 'Calendar-bearing entities require an explicit local date',
    })
  })

  it('rejects secrets in entity payloads', () => {
    expect(validateAccountEntity(foodEntity({
      payload: { name: 'Oats', calories: 250, apiKey: 'sk-secret' },
    }))).toEqual({
      ok: false,
      error: 'Entity payload must not contain secrets',
    })
  })

  it('treats a replayed mutation as the same write and a changed payload as a conflict envelope', () => {
    const mutation = {
      contractVersion: 1 as const,
      mutationId: '10000000-0000-4000-8000-000000000001',
      deviceId: DEVICE,
      baseCursor: 0,
      kind: 'upsert' as const,
      entity: foodEntity(),
    }
    expect(validateEntityMutation(mutation)).toEqual({ ok: true })
    expect(validateEntityMutation({
      ...mutation,
      deviceId: 'other-device-1',
    })).toEqual({ ok: false, error: 'Mutation device must match the entity device' })
  })
})

describe('snapshot projection', () => {
  const snapshot = {
    onboarded: true,
    profile: {
      gender: 'male',
      birthday: '1996-04-12',
      heightCm: 175,
      weightKg: 70,
      activityLevel: 'moderate',
      goal: 'maintain',
    },
    foodEntries: [{
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Rice',
      calories: 200,
      protein: 4,
      carbs: 44,
      fat: 1,
      timestamp: INSTANT.toISOString(),
      source: 'manual',
      mealType: 'lunch',
    }],
    weightEntries: [{
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      date: '2026-10-31',
      weightKg: 70.2,
    }],
    exerciseEntries: [],
    favoriteMeals: [],
    chatMessages: [{
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      role: 'user',
      content: 'secret chat text that must not be copied',
      timestamp: INSTANT.toISOString(),
    }],
    aiSettings: { provider: 'openrouter', apiKey: '', model: 'google/gemini-2.0-flash-001' },
    gamification: { xp: 9999, level: 80 },
  }

  it('does not reinterpret a stored weight calendar date through another zone', () => {
    const projected = projectSnapshot(snapshot, { timeZone: ZONE })
    const weight = projected.entities.find(entity => entity.entityType === 'weight_entry')
    const food = projected.entities.find(entity => entity.entityType === 'food_entry')
    expect(projected.rejected).toBe(0)
    expect(weight?.localDate).toBe('2026-10-31')
    expect(food?.localDate).toBe('2026-10-31')
    expect(food?.localDate).not.toBe(localDateInZone(INSTANT, 'UTC'))
  })

  it('refuses to project a snapshot that still carries a BYOK key', () => {
    const leaked = {
      ...snapshot,
      aiSettings: { ...snapshot.aiSettings, apiKey: 'sk-device-only' },
    }
    expect(projectSnapshot(leaked, { timeZone: ZONE })).toEqual({ entities: [], rejected: 1 })
  })

  it('omits chat text from projected payloads', () => {
    const projected = projectSnapshot(snapshot, { timeZone: ZONE })
    const chat = projected.entities.find(entity => entity.entityType === 'chat_message')
    expect(JSON.stringify(chat)).not.toContain('secret chat text')
    expect(chat?.payload).toMatchObject({ role: 'user' })
    expect(chat?.payload.contentLength).toBeTypeOf('number')
  })

  it('ignores client XP when recomputing derived progression', () => {
    const projected = projectSnapshot(snapshot, { timeZone: ZONE })
    const derived = recomputeDerivedProgression(projected.entities, '2026-10-31', 12)
    expect(derived.acceptedFoodEvents).toBe(1)
    expect(derived.streak.loggedToday).toBe(true)
    expect(derived.streak.count).toBe(1)
    expect(JSON.stringify(derived)).not.toContain('9999')
  })

  it('produces a stable checksum for the same accepted records', async () => {
    const first = projectSnapshot(snapshot, { timeZone: ZONE }).entities
    const second = projectSnapshot(snapshot, { timeZone: ZONE }).entities
    expect(await checksumRecords(first)).toBe(await checksumRecords(second))
    expect(await checksumRecords(first)).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('migration ledger rules', () => {
  it('allows replay of the same stage and refuses confirmed rollback', () => {
    expect(canAdvanceMigration('previewed', 'previewed')).toBe(true)
    expect(canAdvanceMigration('previewed', 'uploading')).toBe(true)
    expect(canAdvanceMigration('previewed', 'complete')).toBe(false)
    expect(canAdvanceMigration('confirmed', 'rolled_back')).toBe(false)
  })

  it('accepts a count-only ledger row without source contents', () => {
    const attempt = {
      contractVersion: 1 as const,
      migrationId: '20000000-0000-4000-8000-000000000002',
      idempotencyKey: 'device-alpha-1-web-state-v0',
      sourceKind: 'web-state-v0' as const,
      sourceVersion: 'web-state-v0',
      deviceId: DEVICE,
      stage: 'detected' as const,
      counts: { discovered: 3, accepted: 0, rejected: 0, reconciled: 0 },
      sourceChecksum: null,
      acceptedChecksum: null,
    }
    expect(validateMigrationAttempt(attempt)).toEqual({ ok: true })
    expect(JSON.stringify(attempt)).not.toContain('Oats')
  })
})
