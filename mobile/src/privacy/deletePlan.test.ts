import { describe, expect, it } from 'vitest'

import {
  DELETE_STORE_IDS,
  confirmationMatches,
  deletionSucceeded,
  runLocalDeletion,
  type DeleteStoreAdapter,
  type DeleteStoreId,
} from './deletePlan'

function adapters(
  overrides: Partial<Record<DeleteStoreId, DeleteStoreAdapter>> = {},
): Record<DeleteStoreId, DeleteStoreAdapter> {
  const ok = async () => undefined
  return Object.fromEntries(
    DELETE_STORE_IDS.map((store) => [store, overrides[store] ?? ok]),
  ) as Record<DeleteStoreId, DeleteStoreAdapter>
}

describe('local deletion plan', () => {
  it('requires the typed DELETE confirmation', () => {
    expect(confirmationMatches('DELETE')).toBe(true)
    expect(confirmationMatches(' delete ')).toBe(false)
    expect(confirmationMatches('delete')).toBe(false)
  })

  it('reports success only when every store confirms', async () => {
    const result = await runLocalDeletion(adapters())
    expect(result.ok).toBe(true)
    expect(deletionSucceeded(result.results)).toBe(true)
    expect(result.results).toHaveLength(DELETE_STORE_IDS.length)
  })

  it('does not treat a partial wipe as success when one store fails', async () => {
    const result = await runLocalDeletion(
      adapters({
        app_lock: async () => {
          throw new Error('secure store unavailable')
        },
      }),
    )

    expect(result.ok).toBe(false)
    expect(deletionSucceeded(result.results)).toBe(false)
    expect(result.results.find((row) => row.store === 'meal_entries')?.ok).toBe(true)
    expect(result.results.find((row) => row.store === 'app_lock')).toEqual({
      store: 'app_lock',
      ok: false,
      error: 'secure store unavailable',
    })
  })

  it('keeps later stores running after a failure so retry is closer to empty', async () => {
    const called: DeleteStoreId[] = []
    const result = await runLocalDeletion(
      adapters({
        foods: async () => {
          called.push('foods')
          throw new Error('foods locked')
        },
        memory: async () => {
          called.push('memory')
        },
        builtin_foods_reseed: async () => {
          called.push('builtin_foods_reseed')
        },
      }),
    )

    expect(result.ok).toBe(false)
    expect(called).toEqual(['foods', 'memory', 'builtin_foods_reseed'])
  })
})
