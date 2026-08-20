import { afterEach, describe, expect, it, vi } from 'vitest'

import { DOMAIN_PACKAGE_ID } from '@fud-ai/domain'
import {
  DATA_BACKEND_BUILD_ID,
  DOMAIN_BUILD_ID,
  DataBackendConfigError,
  dataBackend,
  isCloudBackend,
} from './dataBackend'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('data backend selection', () => {
  it('accepts an explicit local mode', () => {
    vi.stubEnv('VITE_DATA_BACKEND', 'local')
    expect(dataBackend()).toBe('local')
    expect(isCloudBackend()).toBe(false)
  })

  it('accepts an explicit Neon mode', () => {
    vi.stubEnv('VITE_DATA_BACKEND', 'neon')
    expect(dataBackend()).toBe('neon')
    expect(isCloudBackend()).toBe(true)
  })

  it('does not treat an empty or unknown value as local', () => {
    vi.stubEnv('VITE_DATA_BACKEND', '')
    expect(() => dataBackend()).toThrow(DataBackendConfigError)
    vi.stubEnv('VITE_DATA_BACKEND', 'postgres')
    expect(() => dataBackend()).toThrow(DataBackendConfigError)
    expect(() => isCloudBackend()).toThrow(DataBackendConfigError)
  })

  it('bakes searchable build markers for the domain package', () => {
    expect(DOMAIN_BUILD_ID).toBe(DOMAIN_PACKAGE_ID)
    expect(DATA_BACKEND_BUILD_ID).toMatch(/^__FUD_BACKEND_(local|neon|undefined)__$/)
  })
})
