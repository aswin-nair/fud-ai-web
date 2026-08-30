import * as SecureStore from 'expo-secure-store'
import type { AppState } from './types'

const DEVICE_ID_KEY = 'fud-ai-guest-device-id'
const CLAIM_PREFIX = 'fud-ai-guest-claim-'
const AI_KEY_PREFIX = 'fud-ai-private-ai-key-'
const TOKEN_KEY = 'fud-ai-access-token'
const REFRESH_KEY = 'fud-ai-refresh-token'

export function stateWithoutSecrets(state: AppState): AppState {
  return { ...state, aiSettings: { ...state.aiSettings, apiKey: '' } }
}

export async function loadDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id)
  }
  return id
}

export async function markGuestClaim(accountId: string, guestId: string): Promise<void> {
  await SecureStore.setItemAsync(`${CLAIM_PREFIX}${accountId}`, guestId)
}

export async function pendingGuestClaim(accountId: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${CLAIM_PREFIX}${accountId}`)
}

export async function clearGuestClaim(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${CLAIM_PREFIX}${accountId}`)
}

export async function savePrivateAIKey(userId: string, apiKey: string): Promise<void> {
  const key = `${AI_KEY_PREFIX}${userId}`
  if (apiKey.trim()) await SecureStore.setItemAsync(key, apiKey)
  else await SecureStore.deleteItemAsync(key)
}

export async function loadPrivateAIKey(userId: string): Promise<string> {
  return (await SecureStore.getItemAsync(`${AI_KEY_PREFIX}${userId}`)) ?? ''
}

export async function saveSessionTokens(token: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

export async function loadSessionTokens(): Promise<{ token: string | null; refreshToken: string | null }> {
  return {
    token: await SecureStore.getItemAsync(TOKEN_KEY),
    refreshToken: await SecureStore.getItemAsync(REFRESH_KEY),
  }
}

export async function clearSessionTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}
