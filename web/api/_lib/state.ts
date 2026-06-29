import { getDb, asRows } from './db.js'

export async function loadUserState(userId: string): Promise<Record<string, unknown>> {
  const sql = getDb()
  const rows = asRows<{ state: Record<string, unknown> }>(
    await sql`
    SELECT state FROM user_states WHERE user_id = ${userId}::uuid LIMIT 1
  `,
  )
  return rows[0]?.state ?? {}
}

export async function saveUserState(userId: string, state: Record<string, unknown>): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO user_states (user_id, state, updated_at)
    VALUES (${userId}::uuid, ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET state = EXCLUDED.state, updated_at = NOW()
  `
}
