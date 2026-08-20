export const DELETE_CONFIRMATION_TEXT = 'DELETE'

export const DELETE_STORE_IDS = [
  'meal_entries',
  'points_ledger',
  'streak_freezes',
  'quests',
  'foods',
  'profile',
  'onboarding_drafts',
  'product_events',
  'app_lock',
  'memory',
  'builtin_foods_reseed',
] as const

export type DeleteStoreId = (typeof DELETE_STORE_IDS)[number]

export type DeleteStoreResult = {
  store: DeleteStoreId
  ok: boolean
  error?: string
}

export type DeleteStoreAdapter = () => Promise<void>

export async function runLocalDeletion(
  adapters: Record<DeleteStoreId, DeleteStoreAdapter>,
): Promise<{ ok: boolean; results: DeleteStoreResult[] }> {
  const results: DeleteStoreResult[] = []

  for (const store of DELETE_STORE_IDS) {
    try {
      await adapters[store]()
      results.push({ store, ok: true })
    } catch (error) {
      results.push({
        store,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown deletion failure',
      })
    }
  }

  return {
    ok: results.every((result) => result.ok),
    results,
  }
}

export function confirmationMatches(value: string): boolean {
  return value.trim() === DELETE_CONFIRMATION_TEXT
}

export function deletionSucceeded(results: DeleteStoreResult[]): boolean {
  return results.length === DELETE_STORE_IDS.length && results.every((result) => result.ok)
}
