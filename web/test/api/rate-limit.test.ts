import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('../../api/_lib/db.js', () => ({
  getDb: () => db.sql,
  asRows: (result: unknown) => result,
}))

import {
  clientIp,
  consumeTokenBucket,
  enforceAuthRateLimit,
  privateBucketHash,
} from '../../api/_lib/rateLimit.js'

describe('distributed API rate limiting', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'rate-limit-tests-secret-at-least-32-characters')
    db.sql.mockResolvedValue([{ allowed: true }])
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('trusts Vercel forwarding but not a caller-supplied proxy header locally', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
      socket: { remoteAddress: '192.0.2.4' },
    }
    expect(clientIp(req as never)).toBe('192.0.2.4')
    vi.stubEnv('VERCEL', '1')
    expect(clientIp(req as never)).toBe('203.0.113.7')
  })

  it('persists only a deterministic HMAC rather than raw IP or account data', () => {
    const hash = privateBucketHash(['auth', 'ip', '203.0.113.7', 'person@example.com'])
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain('203.0.113.7')
    expect(hash).not.toContain('person@example.com')
  })

  it('ignores an empty or short RATE_LIMIT_SECRET and uses JWT_SECRET', () => {
    const withJwt = privateBucketHash(['auth', 'ip', '203.0.113.7'])
    vi.stubEnv('RATE_LIMIT_SECRET', '')
    expect(privateBucketHash(['auth', 'ip', '203.0.113.7'])).toBe(withJwt)
    vi.stubEnv('RATE_LIMIT_SECRET', 'too-short')
    expect(privateBucketHash(['auth', 'ip', '203.0.113.7'])).toBe(withJwt)
    vi.stubEnv('RATE_LIMIT_SECRET', 'rate-limit-override-secret-at-least-32-chars')
    expect(privateBucketHash(['auth', 'ip', '203.0.113.7'])).not.toBe(withJwt)
  })

  it('uses independent IP and account buckets for authentication', async () => {
    await enforceAuthRateLimit({
      headers: {},
      socket: { remoteAddress: '203.0.113.7' },
    } as never, 'login', 'person@example.com')
    expect(db.sql).toHaveBeenCalledTimes(2)
  })

  it('denies a depleted token bucket', async () => {
    db.sql.mockResolvedValue([])
    await expect(consumeTokenBucket('a'.repeat(64), {
      capacity: 1,
      refillPerSecond: 1,
    })).resolves.toBe(false)
  })
})
