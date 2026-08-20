import { Platform } from 'react-native'

import {
  DEVICE_ID_KEY,
  SESSION_META_KEY,
  SESSION_REFRESH_KEY,
  createDeviceId,
  parseStoredBinding,
  type StoredBinding,
} from './sessionPolicy'
import type { SecureSessionStore } from './adoptSession'

type SecureStoreModule = {
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: number
  deleteItemAsync: (key: string) => Promise<void>
  getItemAsync: (key: string) => Promise<string | null>
  isAvailableAsync: () => Promise<boolean>
  setItemAsync: (
    key: string,
    value: string,
    options: { keychainAccessible: number },
  ) => Promise<void>
}

let cached: SecureStoreModule | undefined

function nativeStore(): SecureStoreModule {
  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-secure-store') as SecureStoreModule
  }
  return cached
}

function isNativeAccountPlatform(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios'
}

export const secureSessionStore: SecureSessionStore = {
  available: async () => {
    if (!isNativeAccountPlatform()) return false
    return nativeStore().isAvailableAsync()
  },
  readRefresh: async () => nativeStore().getItemAsync(SESSION_REFRESH_KEY),
  writeRefresh: async (token) => {
    await nativeStore().setItemAsync(SESSION_REFRESH_KEY, token, {
      keychainAccessible: nativeStore().WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
  },
  clearRefresh: async () => {
    await nativeStore().deleteItemAsync(SESSION_REFRESH_KEY)
  },
  readBinding: async () => {
    const raw = await nativeStore().getItemAsync(SESSION_META_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return null
    }
  },
  writeBinding: async (binding: StoredBinding) => {
    await nativeStore().setItemAsync(SESSION_META_KEY, JSON.stringify(binding), {
      keychainAccessible: nativeStore().WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
  },
  clearBinding: async () => {
    await nativeStore().deleteItemAsync(SESSION_META_KEY)
  },
  readDeviceId: async () => nativeStore().getItemAsync(DEVICE_ID_KEY),
  writeDeviceId: async (deviceId) => {
    await nativeStore().setItemAsync(DEVICE_ID_KEY, deviceId, {
      keychainAccessible: nativeStore().WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    })
  },
}

export async function loadOrCreateDeviceId(store: SecureSessionStore = secureSessionStore): Promise<string> {
  const existing = await store.readDeviceId()
  if (existing) return existing
  const created = createDeviceId(crypto.getRandomValues(new Uint8Array(16)))
  await store.writeDeviceId(created)
  return created
}

export function readBindingFromStore(value: unknown): StoredBinding | null {
  return parseStoredBinding(value)
}
