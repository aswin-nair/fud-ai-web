import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { request, response } from './helpers.js'

const mocks = vi.hoisted(() => ({
  probe: vi.fn(),
}))

vi.mock('../../api/_lib/db.js', () => ({
  probeDatabase: mocks.probe,
}))

import readyHandler from '../../api/ready.js'

describe('readiness check', () => {
  beforeEach(() => {
    mocks.probe.mockReset()
    vi.stubEnv('RELEASE_ID', 'ready-release-1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns ready only after the database probe succeeds', async () => {
    mocks.probe.mockResolvedValue(true)
    const res = response()
    await readyHandler(request({
      headers: { 'x-request-id': 'req-ready-12345678' },
    }) as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      ready: true,
      requestId: 'req-ready-12345678',
      release: 'ready-release-1',
    })
    expect(res.body).not.toHaveProperty('ok')
    expect(res.body).not.toHaveProperty('database')
  })

  it('fails closed when the probe cannot reach the database', async () => {
    mocks.probe.mockResolvedValue(false)
    const res = response()
    await readyHandler(request({
      headers: { 'x-request-id': 'req-down-12345678' },
    }) as never, res as never)

    expect(res.statusCode).toBe(503)
    expect(res.body).toEqual({
      ready: false,
      requestId: 'req-down-12345678',
      release: 'ready-release-1',
    })
    expect(JSON.stringify(res.body)).not.toContain('postgres://')
    expect(JSON.stringify(res.body)).not.toContain('DATABASE_URL')
    expect(JSON.stringify(res.body)).not.toContain('Neon')
  })
})
