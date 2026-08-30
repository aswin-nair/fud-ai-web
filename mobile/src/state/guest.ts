import { canStageGuestClaim, guestUserIdFromDevice } from '@fud-ai/product'
import { clearDurableAccount, loadDurableAccount, pendingCount, saveDurableSnapshot } from './durable'
import { clearGuestClaim, loadDeviceId, markGuestClaim, pendingGuestClaim } from './secrets'

export async function guestUserId(): Promise<string> {
  return guestUserIdFromDevice(await loadDeviceId())
}

export async function stageGuestStateForAccount(accountId: string): Promise<boolean> {
  const sourceId = await guestUserId()
  const guest = loadDurableAccount(sourceId)
  if (!canStageGuestClaim({
    guestOnboarded: Boolean(guest?.state.onboarded),
    guestFoodCount: guest?.state.foodEntries.length ?? 0,
    accountPendingCount: pendingCount(accountId),
  }) || !guest) return false

  saveDurableSnapshot(accountId, guest.state)
  await markGuestClaim(accountId, sourceId)
  return true
}

export async function finalizeGuestClaim(accountId: string): Promise<void> {
  const sourceId = await pendingGuestClaim(accountId)
  if (!sourceId) return
  clearDurableAccount(sourceId)
  await clearGuestClaim(accountId)
}
