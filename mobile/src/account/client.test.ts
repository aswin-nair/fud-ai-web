import { describe, expect, it, vi } from 'vitest'

import { parseMobileSession, postAccount } from './client'

const SESSION = {
  token: 'short-lived-access',
  refreshToken: 'mobile-refresh-token',
  user: {
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'person@example.com',
    name: 'Person',
    provider: 'email' as const,
  },
}

describe('mobile account client', () => {
  it('does not call the network while mobile auth is disabled', async () => {
    const fetchImpl = vi.fn()
    const result = await postAccount('/api/auth/login', {
      email: 'person@example.com',
      password: 'secret-password',
    }, { fetchImpl, env: {} })
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: 'Mobile accounts are not available.',
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends the mobile client mark and never logs the password body in the result', async () => {
    const fetchImpl = vi.fn(async (_url: string, init: { body?: string }) => {
      expect(JSON.parse(init.body ?? '{}')).toMatchObject({ client: 'mobile' })
      return { status: 200, json: async () => SESSION }
    })
    const result = await postAccount('/api/auth/login', {
      email: 'person@example.com',
      password: 'secret-password',
    }, {
      fetchImpl,
      env: {
        EXPO_PUBLIC_ENABLE_MOBILE_AUTH: 'true',
        EXPO_PUBLIC_API_BASE_URL: 'https://app.example',
      },
    })
    expect(result).toEqual({ ok: true, value: SESSION })
    expect(parseMobileSession(SESSION)?.user.email).toBe('person@example.com')
  })

  it('surfaces a provider collision without echoing the address', async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 409,
      json: async () => ({ error: 'An account already exists with a different sign-in method.' }),
    }))
    const result = await postAccount('/api/auth/google', {
      credential: 'id-token',
    }, {
      fetchImpl,
      env: {
        EXPO_PUBLIC_ENABLE_MOBILE_AUTH: 'true',
        EXPO_PUBLIC_API_BASE_URL: 'https://app.example',
      },
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.status).toBe(409)
    expect(result.error).toBe('An account already exists with a different sign-in method.')
    expect(result.error).not.toContain('@')
  })

  it('returns a clear offline state', async () => {
    const result = await postAccount('/api/auth/login', {}, {
      fetchImpl: async () => {
        throw new Error('network')
      },
      env: {
        EXPO_PUBLIC_ENABLE_MOBILE_AUTH: 'true',
        EXPO_PUBLIC_API_BASE_URL: 'https://app.example',
      },
    })
    expect(result).toEqual({
      ok: false,
      status: 0,
      error: 'The network is unavailable. Try again when you are back online.',
    })
  })
})
