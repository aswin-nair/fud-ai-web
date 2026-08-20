import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { asRows, getDb } from './db.js'
import type { SessionUser } from './jwt.js'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000

export interface CreatedSession {
  id: string
  familyId: string
  expiresAt: Date
  refreshToken: string
}

export interface RotatedSession {
  id: string
  familyId: string
  user: SessionUser
  expiresAt: Date
  refreshToken: string
}

export class RefreshReplayError extends Error {
  constructor() {
    super('Refresh token replay detected')
    this.name = 'RefreshReplayError'
  }
}

export class RefreshNotFoundError extends Error {
  constructor() {
    super('Refresh token is not active')
    this.name = 'RefreshNotFoundError'
  }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function newRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createSession(userId: string, now = new Date()): Promise<CreatedSession> {
  const sql = getDb()
  const id = randomUUID()
  const familyId = randomUUID()
  const refreshToken = newRefreshToken()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  await sql`
    INSERT INTO auth_sessions (
      id, user_id, family_id, refresh_token_hash, expires_at
    )
    VALUES (
      ${id}::uuid,
      ${userId}::uuid,
      ${familyId}::uuid,
      ${hashRefreshToken(refreshToken)},
      ${expiresAt.toISOString()}::timestamptz
    )
  `
  return { id, familyId, expiresAt, refreshToken }
}

export async function isSessionActive(userId: string, sessionId: string): Promise<boolean> {
  const sql = getDb()
  const rows = asRows<{ active: boolean }>(await sql`
    SELECT EXISTS (
      SELECT 1
      FROM auth_sessions
      WHERE id = ${sessionId}::uuid
        AND user_id = ${userId}::uuid
        AND revoked_at IS NULL
        AND expires_at > NOW()
    ) AS active
  `)
  return rows[0]?.active === true
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE auth_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE id = ${sessionId}::uuid AND user_id = ${userId}::uuid
  `
}

export async function revokeAllSessions(userId: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE auth_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE user_id = ${userId}::uuid AND revoked_at IS NULL
  `
}

export async function revokeSessionFamily(familyId: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE auth_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE family_id = ${familyId}::uuid AND revoked_at IS NULL
  `
}

export async function rotateRefreshToken(presentedToken: string): Promise<RotatedSession> {
  const sql = getDb()
  const presentedHash = hashRefreshToken(presentedToken)
  const rows = asRows<{
    id: string
    family_id: string
    refresh_token_hash: string | null
    previous_refresh_token_hash: string | null
    expires_at: string
    revoked_at: string | null
    user_id: string
    email: string
    name: string
    picture: string | null
    provider: 'email' | 'google'
  }>(await sql`
    SELECT
      session.id,
      session.family_id,
      session.refresh_token_hash,
      session.previous_refresh_token_hash,
      session.expires_at,
      session.revoked_at,
      users.id AS user_id,
      users.email,
      users.name,
      users.picture,
      users.provider
    FROM auth_sessions AS session
    JOIN users ON users.id = session.user_id
    WHERE (
      session.refresh_token_hash = ${presentedHash}
      OR session.previous_refresh_token_hash = ${presentedHash}
    )
      AND session.expires_at > NOW()
    LIMIT 1
  `)
  const row = rows[0]
  if (!row || row.revoked_at) throw new RefreshNotFoundError()
  if (row.previous_refresh_token_hash === presentedHash && row.refresh_token_hash !== presentedHash) {
    await revokeSessionFamily(row.family_id)
    throw new RefreshReplayError()
  }
  if (row.refresh_token_hash !== presentedHash) throw new RefreshNotFoundError()

  const refreshToken = newRefreshToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const rotated = asRows<{ id: string }>(await sql`
    UPDATE auth_sessions
    SET previous_refresh_token_hash = refresh_token_hash,
        refresh_token_hash = ${hashRefreshToken(refreshToken)},
        expires_at = ${expiresAt.toISOString()}::timestamptz
    WHERE id = ${row.id}::uuid
      AND refresh_token_hash = ${presentedHash}
      AND revoked_at IS NULL
    RETURNING id
  `)
  if (!rotated[0]) throw new RefreshNotFoundError()
  return {
    id: row.id,
    familyId: row.family_id,
    expiresAt,
    refreshToken,
    user: {
      sub: row.user_id,
      email: row.email,
      name: row.name,
      picture: row.picture ?? undefined,
      provider: row.provider,
    },
  }
}
