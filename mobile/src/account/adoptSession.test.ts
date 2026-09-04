import { beforeEach, describe, expect, it } from 'vitest'

import { adoptMobileSession, signOutLocally, type SecureSessionStore } from './adoptSession'
import { clearMemorySession, getAccessToken, getActiveUserId } from './sessionMemory'
import { loadBoundAccountIdFromStore, type StoredBinding } from './sessionPolicy'

const USER = '00000000-0000-4000-8000-000000000001'
const OTHER = '00000000-0000-4000-8000-000000000002'
const DEVICE = 'mobile-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

function memoryStore(initial?: { refresh?: string; binding?: StoredBinding }): SecureSessionStore {
  let refresh = initial?.refresh ?? null
  let binding: StoredBinding | null = initial?.binding ?? null
  let deviceId = DEVICE
  return {
    available: async () => true,
    readRefresh: async () => refresh,
    writeRefresh: async (token) => {
      refresh = token
    },
    clearRefresh: async () => {
      refresh = null
    },
    readBinding: async () => binding,
    writeBinding: async (next) => {
      binding = next
    },
    clearBinding: async () => {
      binding = null
    },
    readDeviceId: async () => deviceId,
    writeDeviceId: async (next) => {
      deviceId = next
    },
  }
}

const session = {
  token: 'short-lived-access',
  refreshToken: 'mobile-refresh-token',
  user: { sub: USER, email: 'person@example.com', name: 'Person', provider: 'email' as const },
}

describe('adopt mobile session', () => {
  beforeEach(() => {
    clearMemorySession()
  })

  it('stores the refresh token only in the secure adapter and the access token in memory', async () => {
    const store = memoryStore()
    const result = await adoptMobileSession({
      payload: session,
      store,
      hasLocalProductData: false,
      deviceId: DEVICE,
    })
    expect(result.ok).toBe(true)
    expect(await store.readRefresh()).toBe('mobile-refresh-token')
    expect(await store.readBinding()).toEqual({
      boundUserId: USER,
      deviceId: DEVICE,
      email: 'person@example.com',
      name: 'Person',
    })
    expect(JSON.stringify(await store.readBinding())).not.toContain('mobile-refresh-token')
    expect(getAccessToken()).toBe('short-lived-access')
    expect(getActiveUserId()).toBe(USER)
  })

  it('refuses a second account while local logs exist and does not write that session', async () => {
    const store = memoryStore({
      binding: { boundUserId: USER, deviceId: DEVICE, email: 'a@example.com', name: 'A' },
    })
    const result = await adoptMobileSession({
      payload: {
        ...session,
        user: { ...session.user, sub: OTHER },
      },
      store,
      hasLocalProductData: true,
      deviceId: DEVICE,
    })
    expect(result.ok).toBe(false)
    expect(await store.readRefresh()).toBeNull()
    expect(getActiveUserId()).toBeNull()
  })

  it('clears the refresh credential on sign-out and keeps the local binding', async () => {
    const store = memoryStore({
      refresh: 'mobile-refresh-token',
      binding: { boundUserId: USER, deviceId: DEVICE, email: 'person@example.com', name: 'Person' },
    })
    await adoptMobileSession({
      payload: session,
      store,
      hasLocalProductData: true,
      deviceId: DEVICE,
    })
    await signOutLocally(store)
    expect(getAccessToken()).toBeNull()
    expect(await store.readRefresh()).toBeNull()
    expect((await store.readBinding() as StoredBinding).boundUserId).toBe(USER)
    expect(await loadBoundAccountIdFromStore(store)).toBe(USER)
  })

  it('does not restore an account id from malformed local metadata', async () => {
    const store = memoryStore()
    store.readBinding = async () => ({ boundUserId: 'not-an-account', deviceId: DEVICE })
    expect(await loadBoundAccountIdFromStore(store)).toBeNull()
  })
})
