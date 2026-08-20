const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const DEVICE_ID = /^[A-Za-z0-9._:-]{8,128}$/
const SECRET_KEYS = ['refreshToken', 'token', 'accessToken', 'password', 'apiKey', 'refresh_token']

export const SESSION_REFRESH_KEY = 'fud.session.refresh.v1'
export const SESSION_META_KEY = 'fud.session.meta.v1'
export const DEVICE_ID_KEY = 'fud.device-id.v1'

export type SessionMeta = {
  userId: string
  deviceId: string
  email: string
  name: string
}

export type StoredBinding = {
  boundUserId: string | null
  deviceId: string
  email: string | null
  name: string | null
}

export type BindingDecision =
  | { ok: true }
  | { ok: false; reason: 'account-mismatch' | 'invalid-user' | 'invalid-device' }

function row(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isAccountUserId(value: unknown): value is string {
  return typeof value === 'string' && USER_ID.test(value)
}

export function isMobileDeviceId(value: unknown): value is string {
  return typeof value === 'string' && DEVICE_ID.test(value)
}

export function createDeviceId(bytes: Uint8Array): string {
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `mobile-${hex}`
}

export function sessionRecordContainsSecret(value: unknown): boolean {
  if (!row(value)) return false
  return SECRET_KEYS.some((key) => {
    const candidate = value[key]
    return typeof candidate === 'string' ? candidate.trim().length > 0 : candidate != null
  })
}

export function parseSessionMeta(value: unknown): SessionMeta | null {
  if (!row(value) || sessionRecordContainsSecret(value)) return null
  if (!isAccountUserId(value.userId) || !isMobileDeviceId(value.deviceId)) return null
  if (typeof value.email !== 'string' || typeof value.name !== 'string') return null
  return {
    userId: value.userId,
    deviceId: value.deviceId,
    email: value.email,
    name: value.name,
  }
}

export function parseStoredBinding(value: unknown): StoredBinding | null {
  if (!row(value) || sessionRecordContainsSecret(value)) return null
  if (!isMobileDeviceId(value.deviceId)) return null
  if (value.boundUserId !== null && !isAccountUserId(value.boundUserId)) return null
  if (value.email !== null && typeof value.email !== 'string') return null
  if (value.name !== null && typeof value.name !== 'string') return null
  return {
    boundUserId: value.boundUserId,
    deviceId: value.deviceId,
    email: value.email,
    name: value.name,
  }
}

export function decideAccountBinding(input: {
  boundUserId: string | null
  hasLocalProductData: boolean
  incomingUserId: string
  incomingDeviceId: string
}): BindingDecision {
  if (!isAccountUserId(input.incomingUserId)) return { ok: false, reason: 'invalid-user' }
  if (!isMobileDeviceId(input.incomingDeviceId)) return { ok: false, reason: 'invalid-device' }
  if (!input.boundUserId || input.boundUserId === input.incomingUserId) return { ok: true }
  if (input.hasLocalProductData) return { ok: false, reason: 'account-mismatch' }
  return { ok: true }
}

export function bindingAfterSignOut(binding: StoredBinding): StoredBinding {
  return {
    boundUserId: binding.boundUserId,
    deviceId: binding.deviceId,
    email: binding.email,
    name: binding.name,
  }
}

export const ACCOUNT_MISMATCH_MESSAGE =
  'This device already has logs for another account. Export or delete them before signing in here.'

export const SECURE_STORAGE_UNAVAILABLE_MESSAGE =
  'Secure session storage is not available on this device. The local log stays on the device.'

export const MOBILE_AUTH_UNAVAILABLE_MESSAGE = 'Mobile accounts are not available.'
