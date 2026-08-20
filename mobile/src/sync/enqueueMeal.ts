import { readMobileAccountConfig } from '@/account/config'
import { getActiveUserId } from '@/account/sessionMemory'
import { loadOrCreateDeviceId } from '@/account/secureSession'
import { enqueueMutation, readSyncCursor } from '@/db/queries/outbox'
import type { MealEntry } from '@/db/schema'
import { mealEntryToMutation } from './projectMeal'

export async function enqueueLoggedMeal(
  entry: MealEntry,
  timezone: string,
  foodName?: string | null,
): Promise<void> {
  try {
    const config = readMobileAccountConfig()
    if (!config.entitySyncEnabled) return
    const userId = getActiveUserId()
    if (!userId) return
    const deviceId = await loadOrCreateDeviceId()
    const mutation = mealEntryToMutation({
      entry,
      foodName,
      userId,
      deviceId,
      timeZone: timezone,
      mutationId: crypto.randomUUID(),
      baseCursor: await readSyncCursor(userId),
    })
    if (!mutation) return
    await enqueueMutation(mutation, userId)
  } catch {
    // Local logging already succeeded. A sync queue failure must not roll it back.
  }
}
