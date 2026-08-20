import { afterEach, describe, expect, it, vi } from 'vitest'

import { saveAuthToken } from './apiClient'
import { logoutAccount } from './authService'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: key => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cloud sign-out', () => {
  it('captures and revokes the server session while clearing local credentials', async () => {
    const storage = memoryStorage()
    storage.setItem('fud-ai-auth-token', 'legacy-30-day-token')
    storage.setItem('fud-ai-auth-session', JSON.stringify({ sub: 'user-1' }))
    vi.stubGlobal('localStorage', storage)
    saveAuthToken('captured-token')
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer captured-token')
      expect(localStorage.getItem('fud-ai-auth-token')).toBeNull()
      expect(localStorage.getItem('fud-ai-auth-session')).toBeNull()
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }))

    await expect(logoutAccount(true)).resolves.toBe(true)
  })

  it('still completes device sign-out when revocation is offline', async () => {
    const storage = memoryStorage()
    storage.setItem('fud-ai-auth-token', 'legacy-30-day-token')
    storage.setItem('fud-ai-auth-session', JSON.stringify({ sub: 'user-1' }))
    vi.stubGlobal('localStorage', storage)
    saveAuthToken('captured-token')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))

    await expect(logoutAccount(true)).resolves.toBe(false)
    expect(localStorage.getItem('fud-ai-auth-token')).toBeNull()
    expect(localStorage.getItem('fud-ai-auth-session')).toBeNull()
  })
})
