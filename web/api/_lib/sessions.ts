import { randomUUID } from 'node:crypto'
import { asRows, getDb } from './db.js'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000

export interface CreatedSession {
  id: string
  expiresAt: Date
}

export async function createSession(userId: string, now = new Date()): Promise<CreatedSession> {
  const sql = getDb()
  const id = randomUUID()
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS)
  await sql`
    INSERT INTO auth_sessions (id, user_id, expires_at)
    VALUES (${id}::uuid, ${userId}::uuid, ${expiresAt.toISOString()}::timestamptz)
  `
  return { id, expiresAt }
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
