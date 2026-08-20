import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import geminiHandler from '../../api/gemini.js'
import { response } from './helpers.js'

const UNAVAILABLE_RESPONSE = {
  error: {
    code: 'managed_ai_unavailable',
    message: 'Managed AI is unavailable. Use Bring Your Own Key.',
  },
}

describe('managed AI fail-closed boundary', () => {
  const fetchSpy = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubEnv('GEMINI_API_KEY', 'configured-but-must-not-be-used')
    vi.stubEnv('DEEPGRAM_API_KEY', 'configured-but-must-not-be-used')
    vi.stubEnv('KV_REST_API_URL', 'https://quota.example.invalid')
    vi.stubEnv('KV_REST_API_TOKEN', 'configured-but-must-not-be-used')
  })

  afterEach(() => {
    fetchSpy.mockReset()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each([
    ['GET', undefined],
    ['POST', { task: 'food', body: { contents: [{ role: 'user' }] } }],
  ])('returns the same redacted 503 for %s without quota or provider calls', async (method, body) => {
    const res = response()

    await geminiHandler({
      method,
      headers: { 'x-fudai-install-id': 'attacker-controlled-install-id' },
      body,
    } as never, res as never)

    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(UNAVAILABLE_RESPONSE)
    expect(JSON.stringify(res.body)).not.toContain('GEMINI_API_KEY')
    expect(JSON.stringify(res.body)).not.toContain('DEEPGRAM_API_KEY')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fails closed before request validation and applies security headers', async () => {
    const res = response()

    await geminiHandler({ method: 'POST', headers: {}, body: null } as never, res as never)

    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual(UNAVAILABLE_RESPONSE)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(res.headers.get('cross-origin-resource-policy')).toBe('same-origin')
    expect(res.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()')
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
    expect(res.headers.get('strict-transport-security')).toContain('max-age=31536000')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
