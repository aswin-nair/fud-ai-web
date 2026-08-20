import { afterEach, describe, expect, it, vi } from 'vitest'
import { request, response } from './helpers.js'

import healthHandler from '../../api/health.js'
import { releaseId, requestIdFrom } from '../../api/_lib/http.js'

describe('liveness health check', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports live without treating a connection string as readiness', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://secret-token@db.example/fud')
    const res = response()
    await healthHandler(request({
      headers: { 'x-request-id': 'req-live-12345678' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      live: true,
      requestId: 'req-live-12345678',
      release: 'unassigned',
    })
    expect(res.body).not.toHaveProperty('ok')
    expect(res.body).not.toHaveProperty('database')
    expect(JSON.stringify(res.body)).not.toContain('postgres://')
    expect(JSON.stringify(res.body)).not.toContain('secret-token')
    expect(res.headers.get('x-request-id')).toBe('req-live-12345678')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('uses a sanitized release identifier', () => {
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'abc123def456')
    expect(releaseId()).toBe('abc123def456')
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'postgres://secret-token')
    expect(releaseId()).toBe('unassigned')
  })

  it('rejects short or unsafe incoming request IDs', () => {
    expect(requestIdFrom({ headers: { 'x-request-id': 'nope' } })).toMatch(
      /^[0-9a-f-]{36}$/i,
    )
  })
})
