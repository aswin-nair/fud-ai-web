import { clearDurableUser, loadDurableState, saveDurableLocalSnapshot } from './durableState'
import { clearOnboardingDraft } from './onboarding'
import { clearUserState } from './storage'

const DEVICE_ID_KEY = 'fud-ai-guest-device-id'
const CLAIM_PREFIX = 'fud-ai-guest-claim-'

export function guestUserId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return `guest:${id}`
}

/**
 * Copy the completed device-only journey under the authenticated account key.
 * The source is retained until the account copy is durable (and, in cloud
 * mode, acknowledged by the server).
 */
export async function stageGuestStateForAccount(accountId: string): Promise<boolean> {
  const sourceId = guestUserId()
  const guest = await loadDurableState(sourceId)
  if (!guest?.state.onboarded || guest.state.foodEntries.length === 0) return false
  const account = await loadDurableState(accountId)
  // Never overwrite unsynced work from a previous account session. The guest
  // copy stays intact on its own key and can be exported or claimed later.
  if (account?.pendingCount) return false

  await saveDurableLocalSnapshot(accountId, guest.state)
  localStorage.setItem(`${CLAIM_PREFIX}${accountId}`, sourceId)
  return true
}

export function hasPendingGuestClaim(accountId: string): boolean {
  return Boolean(localStorage.getItem(`${CLAIM_PREFIX}${accountId}`))
}

export async function finalizeGuestClaim(accountId: string): Promise<void> {
  const key = `${CLAIM_PREFIX}${accountId}`
  const sourceId = localStorage.getItem(key)
  if (!sourceId) return
  await clearDurableUser(sourceId)
  clearUserState(sourceId)
  clearOnboardingDraft(sourceId)
  localStorage.removeItem(key)
}
