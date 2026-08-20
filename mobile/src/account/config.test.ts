import { describe, expect, it } from 'vitest'

import { accountServicesAvailable, readMobileAccountConfig } from './config'

describe('mobile account config', () => {
  it('stays unavailable until an explicit API origin and flag are set', () => {
    expect(readMobileAccountConfig({})).toEqual({
      apiBaseUrl: '',
      mobileAuthEnabled: false,
      entitySyncEnabled: false,
    })
    expect(accountServicesAvailable(readMobileAccountConfig({}))).toBe(false)
  })

  it('requires both the flag and an http origin', () => {
    expect(accountServicesAvailable(readMobileAccountConfig({
      EXPO_PUBLIC_ENABLE_MOBILE_AUTH: 'true',
      EXPO_PUBLIC_API_BASE_URL: 'https://app.example',
    }))).toBe(true)
    expect(accountServicesAvailable(readMobileAccountConfig({
      EXPO_PUBLIC_ENABLE_MOBILE_AUTH: 'true',
      EXPO_PUBLIC_API_BASE_URL: '',
    }))).toBe(false)
  })
})
