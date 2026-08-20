import { parseMobileSession, type MobileSessionResponse } from './client'
import { clearMemorySession, setAccessToken, setActiveUserId } from './sessionMemory'
import {
  ACCOUNT_MISMATCH_MESSAGE,
  decideAccountBinding,
  parseStoredBinding,
  type StoredBinding,
} from './sessionPolicy'

export type SecureSessionStore = {
  available: () => Promise<boolean>
  readRefresh: () => Promise<string | null>
  writeRefresh: (token: string) => Promise<void>
  clearRefresh: () => Promise<void>
  readBinding: () => Promise<unknown>
  writeBinding: (binding: StoredBinding) => Promise<void>
  clearBinding: () => Promise<void>
  readDeviceId: () => Promise<string | null>
  writeDeviceId: (deviceId: string) => Promise<void>
}

export async function adoptMobileSession(input: {
  payload: unknown
  store: SecureSessionStore
  hasLocalProductData: boolean
  deviceId: string
}): Promise<{ ok: true; session: MobileSessionResponse } | { ok: false; error: string }> {
  if (!(await input.store.available())) {
    return { ok: false, error: 'Secure session storage is not available on this device. The local log stays on the device.' }
  }
  const session = parseMobileSession(input.payload)
  if (!session) return { ok: false, error: 'The account response was incomplete.' }

  const existing = parseStoredBinding(await input.store.readBinding())
  const decision = decideAccountBinding({
    boundUserId: existing?.boundUserId ?? null,
    hasLocalProductData: input.hasLocalProductData,
    incomingUserId: session.user.sub,
    incomingDeviceId: input.deviceId,
  })
  if (!decision.ok) {
    return {
      ok: false,
      error: decision.reason === 'account-mismatch'
        ? ACCOUNT_MISMATCH_MESSAGE
        : 'The account session is not valid on this device.',
    }
  }

  await input.store.writeRefresh(session.refreshToken)
  await input.store.writeBinding({
    boundUserId: session.user.sub,
    deviceId: input.deviceId,
    email: session.user.email,
    name: session.user.name,
  })
  setAccessToken(session.token)
  setActiveUserId(session.user.sub)
  return { ok: true, session }
}

export async function signOutLocally(store: SecureSessionStore): Promise<void> {
  clearMemorySession()
  if (await store.available()) {
    await store.clearRefresh()
  }
}

export async function clearAccountBinding(store: SecureSessionStore): Promise<void> {
  clearMemorySession()
  if (!(await store.available())) return
  await store.clearRefresh()
  await store.clearBinding()
}
