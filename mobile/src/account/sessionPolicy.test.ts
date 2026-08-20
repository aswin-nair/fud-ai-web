import { describe, expect, it } from 'vitest'

import { clearMemorySession, getAccessToken, setAccessToken } from './sessionMemory'
import {
  ACCOUNT_MISMATCH_MESSAGE,
  createDeviceId,
  decideAccountBinding,
  parseSessionMeta,
  parseStoredBinding,
  sessionRecordContainsSecret,
} from './sessionPolicy'

const USER = '00000000-0000-4000-8000-000000000001'
const OTHER = '00000000-0000-4000-8000-000000000002'
const DEVICE = 'mobile-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

describe('mobile session policy', () => {
  it('keeps the access token in memory only', () => {
    setAccessToken('short-lived-access')
    expect(getAccessToken()).toBe('short-lived-access')
    clearMemorySession()
    expect(getAccessToken()).toBeNull()
  })

  it('creates a stable device id that matches the contract alphabet', () => {
    expect(createDeviceId(new Uint8Array(16).fill(10))).toBe(
      'mobile-0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a',
    )
  })

  it('rejects session metadata that carries a refresh or access token', () => {
    expect(sessionRecordContainsSecret({
      userId: USER,
      refreshToken: 'secret-refresh',
    })).toBe(true)
    expect(parseSessionMeta({
      userId: USER,
      deviceId: DEVICE,
      email: 'person@example.com',
      name: 'Person',
      token: 'opaque',
    })).toBeNull()
  })

  it('blocks a second account while local product data is present', () => {
    expect(decideAccountBinding({
      boundUserId: USER,
      hasLocalProductData: true,
      incomingUserId: OTHER,
      incomingDeviceId: DEVICE,
    })).toEqual({ ok: false, reason: 'account-mismatch' })
    expect(ACCOUNT_MISMATCH_MESSAGE).toContain('Export or delete')
  })

  it('allows the same account to sign back in without crossing data', () => {
    expect(decideAccountBinding({
      boundUserId: USER,
      hasLocalProductData: true,
      incomingUserId: USER,
      incomingDeviceId: DEVICE,
    })).toEqual({ ok: true })
  })

  it('allows a new account only after local product data is gone', () => {
    expect(decideAccountBinding({
      boundUserId: USER,
      hasLocalProductData: false,
      incomingUserId: OTHER,
      incomingDeviceId: DEVICE,
    })).toEqual({ ok: true })
  })

  it('parses a secret-free binding and keeps the bound user after sign-out', () => {
    expect(parseStoredBinding({
      boundUserId: USER,
      deviceId: DEVICE,
      email: 'person@example.com',
      name: 'Person',
    })).toEqual({
      boundUserId: USER,
      deviceId: DEVICE,
      email: 'person@example.com',
      name: 'Person',
    })
  })
})
