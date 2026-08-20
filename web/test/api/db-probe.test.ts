import { afterEach, describe, expect, it, vi } from 'vitest'

import * as db from '../../api/_lib/db.js'

describe('database readiness probe', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns false when no connection string is configured', async () => {
    vi.stubEnv('DATABASE_URL', '')
    await expect(db.probeDatabase()).resolves.toBe(false)
  })

  it('returns true only when SELECT 1 succeeds', async () => {
    const sql = vi.fn(async () => [{ ok: 1 }])
    await expect(db.runBoundedProbe(sql as never)).resolves.toBe(true)
    expect(sql).toHaveBeenCalledOnce()
  })

  it('returns false without exposing provider errors', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://secret-token@db.example/fud')
    const sql = vi.fn(async () => {
      throw new Error('connect ECONNREFUSED postgres://secret-token@db.example/fud')
    })
    await expect(db.probeDatabase(() => sql as never)).resolves.toBe(false)
  })
})
