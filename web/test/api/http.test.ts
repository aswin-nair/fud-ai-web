import { describe, expect, it, vi } from 'vitest'
import { json, serverError } from '../../api/_lib/http.js'
import { response } from './helpers.js'

describe('API response hardening', () => {
  it('applies no-store and browser security headers to JSON responses', () => {
    const res = response()
    json(res as never, 200, { ok: true })
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'")
    expect(res.headers.get('referrer-policy')).toBe('no-referrer')
  })

  it('redacts internal error messages from responses and logs', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const res = response()
    serverError(res as never, new Error('DATABASE_URL=postgres://secret-token'))

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    const logged = JSON.stringify(spy.mock.calls)
    expect(logged).not.toContain('postgres://secret-token')
    expect(logged).not.toContain('DATABASE_URL')
    spy.mockRestore()
  })
})
