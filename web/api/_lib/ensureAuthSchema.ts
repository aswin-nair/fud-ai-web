import type { VercelResponse } from '@vercel/node'
import { getDb, isDbConfigured } from './db.js'
import { json } from './http.js'
import { isAuthSecretConfigured } from './jwt.js'

export class AuthSchemaError extends Error {
  constructor() {
    super('Auth schema is incomplete')
    this.name = 'AuthSchemaError'
  }
}

export function isUndefinedRelationError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false
  return error.code === '42P01' || error.code === '42703'
}

let ensured = false

export function resetAuthSchemaEnsure(): void {
  ensured = false
}

export async function ensureAuthSchema(sql = getDb()): Promise<void> {
  if (ensured) return
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        bucket_hash CHAR(64) PRIMARY KEY CHECK (bucket_hash ~ '^[0-9a-f]{64}$'),
        tokens DOUBLE PRECISION NOT NULL CHECK (tokens >= 0),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_id UUID,
        refresh_token_hash TEXT,
        previous_refresh_token_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      )
    `
    await sql`ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS family_id UUID`
    await sql`ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT`
    await sql`ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS previous_refresh_token_hash TEXT`
    await sql`
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_active
      ON auth_sessions (user_id, expires_at) WHERE revoked_at IS NULL
    `
    ensured = true
  } catch {
    throw new AuthSchemaError()
  }
}

export async function prepareAuth(res: VercelResponse): Promise<boolean> {
  if (!isDbConfigured()) {
    json(res, 503, { error: 'Database not configured' })
    return false
  }
  if (!isAuthSecretConfigured()) {
    json(res, 503, { error: 'Authentication is not configured' })
    return false
  }
  try {
    await ensureAuthSchema()
    return true
  } catch {
    json(res, 503, { error: 'Database schema is incomplete' })
    return false
  }
}
