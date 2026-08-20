import { createHash, randomBytes } from 'node:crypto'
import { asRows, getDb } from './db.js'
import { hashPassword, validatePasswordInput } from './password.js'

const RESET_TTL_MS = 30 * 60 * 1_000

function resetTokenHash(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generatePasswordResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: resetTokenHash(token) }
}

/**
 * Service primitive for a future email adapter. The plaintext token must only
 * be sent through the verified provider and must never be logged or persisted.
 */
export async function createPasswordResetToken(
  userId: string,
  now = new Date(),
): Promise<{ token: string; expiresAt: Date } | null> {
  const sql = getDb()
  const { token, tokenHash } = generatePasswordResetToken()
  const expiresAt = new Date(now.getTime() + RESET_TTL_MS)
  const results = await sql.transaction((tx) => [
    tx`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`,
    tx`
      UPDATE password_reset_tokens
      SET consumed_at = COALESCE(consumed_at, NOW())
      WHERE user_id = ${userId}::uuid AND consumed_at IS NULL
    `,
    tx`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
      SELECT id, ${tokenHash}, ${expiresAt.toISOString()}::timestamptz
      FROM users
      WHERE id = ${userId}::uuid AND provider = 'email'
      RETURNING password_reset_tokens.id
    `,
  ])
  if (!asRows<{ id: string }>(results[2])[0]) return null
  return { token, expiresAt }
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<boolean> {
  if (!token || token.length > 256 || validatePasswordInput(newPassword, true)) return false
  const sql = getDb()
  const tokenHash = resetTokenHash(token)
  const credential = hashPassword(newPassword)
  const rows = asRows<{ id: string }>(await sql`
    WITH claimed AS (
      UPDATE password_reset_tokens AS reset
      SET consumed_at = NOW()
      FROM users
      WHERE reset.user_id = users.id
        AND users.provider = 'email'
        AND reset.token_hash = ${tokenHash}
        AND reset.consumed_at IS NULL
        AND reset.expires_at > NOW()
      RETURNING reset.user_id
    ), changed AS (
      UPDATE users
      SET password_hash = ${credential.hash}, password_salt = ${credential.salt}
      FROM claimed
      WHERE users.id = claimed.user_id
      RETURNING users.id
    ), revoked AS (
      UPDATE auth_sessions
      SET revoked_at = COALESCE(revoked_at, NOW())
      WHERE user_id IN (SELECT id FROM changed)
      RETURNING user_id
    )
    SELECT id FROM changed
  `)
  return Boolean(rows[0])
}
