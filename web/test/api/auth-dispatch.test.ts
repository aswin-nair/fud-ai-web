import { afterEach, describe, expect, it, vi } from 'vitest'

import { request, response } from './helpers.js'

describe('auth function dispatch', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('rejects an unknown action without echoing it', async () => {
    const { default: handler } = await import('../../api/auth.js')
    const res = response()
    await handler(request({
      method: 'POST',
      query: { action: 'not-a-route' },
      url: '/api/auth/not-a-route',
    }) as never, res as never)
    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
    expect(JSON.stringify(res.body)).not.toContain('not-a-route')
  })

  it('dispatches a public auth path to its existing handler', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const { default: handler } = await import('../../api/auth.js')
    const res = response()
    await handler(request({
      method: 'POST',
      query: { action: 'login' },
      url: '/api/auth/login',
    }) as never, res as never)
    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({ error: 'Database not configured' })
  })
})
