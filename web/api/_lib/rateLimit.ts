import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import type { VercelRequest } from '@vercel/node'
import { asRows, getDb } from './db.js'

interface TokenBucketPolicy {
  capacity: number
  refillPerSecond: number
}

const AUTH_IP: TokenBucketPolicy = { capacity: 30, refillPerSecond: 30 / 900 }
const AUTH_ACCOUNT: TokenBucketPolicy = { capacity: 10, refillPerSecond: 10 / 900 }
const STATE_IP: TokenBucketPolicy = { capacity: 240, refillPerSecond: 240 / 60 }
const STATE_USER: TokenBucketPolicy = { capacity: 120, refillPerSecond: 120 / 60 }
const ACCOUNT_ACTION: TokenBucketPolicy = { capacity: 10, refillPerSecond: 10 / 300 }

export class RateLimitExceeded extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds = 60) {
    super('Rate limit exceeded')
    this.name = 'RateLimitExceeded'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizeIp(raw: string | undefined): string | null {
  if (!raw) return null
  let candidate = raw.split(',')[0]?.trim() ?? ''
  if (candidate.startsWith('::ffff:') && isIP(candidate.slice(7)) === 4) {
    candidate = candidate.slice(7)
  }
  return isIP(candidate) ? candidate : null
}

/**
 * Vercel overwrites x-forwarded-for to prevent client spoofing. Outside Vercel,
 * forwarded headers are trusted only with an explicit deployment setting.
 */
export function clientIp(req: VercelRequest): string {
  const trustForwarded = process.env.VERCEL === '1' || process.env.TRUST_PROXY === '1'
  if (trustForwarded) {
    const forwarded = normalizeIp(firstHeader(req.headers['x-forwarded-for']))
    if (forwarded) return forwarded
  }
  return normalizeIp(req.socket?.remoteAddress) ?? 'unknown'
}

function limiterSecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('RATE_LIMIT_SECRET or JWT_SECRET must be set (32+ characters)')
  }
  return secret
}

export function privateBucketHash(parts: readonly string[]): string {
  return createHmac('sha256', limiterSecret()).update(parts.join('\u0000')).digest('hex')
}

export async function consumeTokenBucket(
  bucketHash: string,
  policy: TokenBucketPolicy,
): Promise<boolean> {
  const sql = getDb()
  const rows = asRows<{ allowed: boolean }>(await sql`
    INSERT INTO rate_limit_buckets (bucket_hash, tokens, updated_at)
    VALUES (${bucketHash}, ${policy.capacity - 1}, NOW())
    ON CONFLICT (bucket_hash) DO UPDATE
    SET tokens = LEAST(
          ${policy.capacity},
          rate_limit_buckets.tokens
            + EXTRACT(EPOCH FROM (NOW() - rate_limit_buckets.updated_at)) * ${policy.refillPerSecond}
        ) - 1,
        updated_at = NOW()
    WHERE LEAST(
          ${policy.capacity},
          rate_limit_buckets.tokens
            + EXTRACT(EPOCH FROM (NOW() - rate_limit_buckets.updated_at)) * ${policy.refillPerSecond}
        ) >= 1
    RETURNING TRUE AS allowed
  `)
  return rows[0]?.allowed === true
}

async function requireBucket(parts: readonly string[], policy: TokenBucketPolicy) {
  if (!await consumeTokenBucket(privateBucketHash(parts), policy)) {
    throw new RateLimitExceeded()
  }
}

export async function enforceAuthRateLimit(
  req: VercelRequest,
  endpoint: 'login' | 'register' | 'google' | 'forgot' | 'reset' | 'refresh',
  account?: string,
): Promise<void> {
  await requireBucket(['auth', endpoint, 'ip', clientIp(req)], AUTH_IP)
  const normalized = account?.trim().toLowerCase()
  if (normalized) {
    // A separate account bucket prevents distributed password guessing; it is
    // intentionally not combined with the IP bucket.
    await requireBucket(['auth', endpoint, 'account', normalized], AUTH_ACCOUNT)
  }
}

export async function enforceAuthAccountRateLimit(
  endpoint: 'login' | 'register' | 'google',
  account: string,
): Promise<void> {
  const normalized = account.trim().toLowerCase()
  if (normalized) await requireBucket(['auth', endpoint, 'account', normalized], AUTH_ACCOUNT)
}

export async function enforceStateRateLimit(req: VercelRequest, userId: string): Promise<void> {
  await enforceStateIpRateLimit(req)
  await enforceStateUserRateLimit(userId)
}

export async function enforceStateIpRateLimit(req: VercelRequest): Promise<void> {
  await requireBucket(['state', 'ip', clientIp(req)], STATE_IP)
}

export async function enforceStateUserRateLimit(userId: string): Promise<void> {
  await requireBucket(['state', 'user', userId], STATE_USER)
}

export async function enforceAccountActionRateLimit(
  req: VercelRequest,
  userId: string,
  action: string,
): Promise<void> {
  await enforceAccountIpRateLimit(req, action)
  await enforceAccountUserRateLimit(userId, action)
}

export async function enforceAccountIpRateLimit(
  req: VercelRequest,
  action: string,
): Promise<void> {
  await requireBucket(['account', action, 'ip', clientIp(req)], ACCOUNT_ACTION)
}

export async function enforceAccountUserRateLimit(
  userId: string,
  action: string,
): Promise<void> {
  await requireBucket(['account', action, 'user', userId], ACCOUNT_ACTION)
}
