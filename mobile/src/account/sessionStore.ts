import { create } from 'zustand'

import { hasLocalProductData } from '@/db/queries/outbox'
import { accountServicesAvailable, readMobileAccountConfig } from './config'
import { postAccount } from './client'
import { adoptMobileSession, clearAccountBinding, signOutLocally } from './adoptSession'
import { getAccessToken, getActiveUserId } from './sessionMemory'
import {
  MOBILE_AUTH_UNAVAILABLE_MESSAGE,
  SECURE_STORAGE_UNAVAILABLE_MESSAGE,
  parseStoredBinding,
} from './sessionPolicy'
import { loadOrCreateDeviceId, secureSessionStore } from './secureSession'

export type AccountStatus = 'loading' | 'signed-out' | 'signed-in' | 'unavailable' | 'storage-error'

type AccountState = {
  status: AccountStatus
  email: string | null
  name: string | null
  message: string | null
  busy: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  requestReset: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  deleteAccount: () => Promise<boolean>
}

async function restoreBinding() {
  const binding = parseStoredBinding(await secureSessionStore.readBinding())
  return binding
}

export const useAccountStore = create<AccountState>((set, get) => ({
  status: 'loading',
  email: null,
  name: null,
  message: null,
  busy: false,

  initialize: async () => {
    set({ status: 'loading', message: null })
    const config = readMobileAccountConfig()
    if (!accountServicesAvailable(config)) {
      set({ status: 'unavailable', message: MOBILE_AUTH_UNAVAILABLE_MESSAGE, busy: false })
      return
    }
    if (!(await secureSessionStore.available())) {
      set({ status: 'storage-error', message: SECURE_STORAGE_UNAVAILABLE_MESSAGE, busy: false })
      return
    }

    const binding = await restoreBinding()
    const refresh = await secureSessionStore.readRefresh()
    if (!refresh) {
      set({
        status: 'signed-out',
        email: binding?.email ?? null,
        name: binding?.name ?? null,
        busy: false,
      })
      return
    }

    const refreshed = await postAccount('/api/auth/refresh', { refreshToken: refresh })
    if (!refreshed.ok) {
      await signOutLocally(secureSessionStore)
      set({
        status: 'signed-out',
        email: binding?.email ?? null,
        name: binding?.name ?? null,
        message: refreshed.status === 0
          ? refreshed.error
          : 'The saved session could not be restored. Sign in again.',
        busy: false,
      })
      return
    }

    const deviceId = await loadOrCreateDeviceId()
    const adopted = await adoptMobileSession({
      payload: refreshed.value,
      store: secureSessionStore,
      hasLocalProductData: await hasLocalProductData(),
      deviceId,
    })
    if (!adopted.ok) {
      set({ status: 'signed-out', message: adopted.error, busy: false })
      return
    }
    set({
      status: 'signed-in',
      email: adopted.session.user.email,
      name: adopted.session.user.name,
      message: null,
      busy: false,
    })
  },

  signIn: async (email, password) => {
    if (get().busy) return false
    set({ busy: true, message: null })
    const deviceId = await loadOrCreateDeviceId()
    const result = await postAccount('/api/auth/login', { email, password })
    if (!result.ok) {
      set({ busy: false, message: result.error })
      return false
    }
    const adopted = await adoptMobileSession({
      payload: result.value,
      store: secureSessionStore,
      hasLocalProductData: await hasLocalProductData(),
      deviceId,
    })
    if (!adopted.ok) {
      set({ busy: false, message: adopted.error })
      return false
    }
    set({
      status: 'signed-in',
      email: adopted.session.user.email,
      name: adopted.session.user.name,
      message: null,
      busy: false,
    })
    return true
  },

  register: async (name, email, password) => {
    if (get().busy) return false
    set({ busy: true, message: null })
    const deviceId = await loadOrCreateDeviceId()
    const result = await postAccount('/api/auth/register', { name, email, password })
    if (!result.ok) {
      set({ busy: false, message: result.error })
      return false
    }
    const adopted = await adoptMobileSession({
      payload: result.value,
      store: secureSessionStore,
      hasLocalProductData: await hasLocalProductData(),
      deviceId,
    })
    if (!adopted.ok) {
      set({ busy: false, message: adopted.error })
      return false
    }
    set({
      status: 'signed-in',
      email: adopted.session.user.email,
      name: adopted.session.user.name,
      message: null,
      busy: false,
    })
    return true
  },

  requestReset: async (email) => {
    if (get().busy) return false
    set({ busy: true, message: null })
    const result = await postAccount('/api/auth/forgot-password', { email })
    set({
      busy: false,
      message: result.ok
        ? 'If that address can receive mail, a reset link will arrive shortly.'
        : result.error,
    })
    return result.ok
  },

  signOut: async () => {
    const token = getAccessToken()
    if (token) {
      await postAccount('/api/auth/logout', {}, { accessToken: token }).catch(() => undefined)
    }
    await signOutLocally(secureSessionStore)
    const binding = await restoreBinding()
    set({
      status: 'signed-out',
      email: binding?.email ?? null,
      name: binding?.name ?? null,
      message: null,
      busy: false,
    })
  },

  signOutEverywhere: async () => {
    const token = getAccessToken()
    if (token) {
      await postAccount('/api/auth/logout-all', {}, { accessToken: token }).catch(() => undefined)
    }
    await signOutLocally(secureSessionStore)
    const binding = await restoreBinding()
    set({
      status: 'signed-out',
      email: binding?.email ?? null,
      name: binding?.name ?? null,
      message: 'Signed out on this device. Other devices may still need a moment to expire.',
      busy: false,
    })
  },

  deleteAccount: async () => {
    if (get().busy) return false
    const token = getAccessToken()
    const userId = getActiveUserId()
    if (!token || !userId) {
      set({ message: 'Sign in again before deleting the account.' })
      return false
    }
    set({ busy: true, message: null })
    const result = await postAccount('/api/account', { confirmation: 'DELETE' }, {
      method: 'DELETE',
      accessToken: token,
    })
    if (!result.ok) {
      set({ busy: false, message: result.error })
      return false
    }
    await clearAccountBinding(secureSessionStore)
    set({
      status: 'signed-out',
      email: null,
      name: null,
      message: 'The account was deleted. Local logs on this device were not removed.',
      busy: false,
    })
    return true
  },
}))
