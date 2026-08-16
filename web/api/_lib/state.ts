import { getDb, asRows } from './db.js'

/** Defense in depth: clients must not be able to persist BYOK credentials. */
export function stripPrivateStateSecrets(
  state: Record<string, unknown>,
): Record<string, unknown> {
  const aiSettings = state.aiSettings
  if (!aiSettings || typeof aiSettings !== 'object' || Array.isArray(aiSettings)) return state

  const { apiKey: _apiKey, ...safeAISettings } = aiSettings as Record<string, unknown>
  return { ...state, aiSettings: safeAISettings }
}

export async function loadUserState(userId: string): Promise<Record<string, unknown>> {
  const sql = getDb()
  // Purge credentials written by older clients before returning the state.
  await sql`
    UPDATE user_states
    SET state = state #- '{aiSettings,apiKey}'::text[], updated_at = NOW()
    WHERE user_id = ${userId}::uuid
      AND state #>> '{aiSettings,apiKey}'::text[] IS NOT NULL
  `
  const rows = asRows<{ state: Record<string, unknown> }>(
    await sql`
    SELECT state FROM user_states WHERE user_id = ${userId}::uuid LIMIT 1
  `,
  )
  return stripPrivateStateSecrets(rows[0]?.state ?? {})
}

export async function saveUserState(userId: string, state: Record<string, unknown>): Promise<void> {
  const sql = getDb()
  const safeState = stripPrivateStateSecrets(state)
  await sql`
    INSERT INTO user_states (user_id, state, updated_at)
    VALUES (${userId}::uuid, ${JSON.stringify(safeState)}::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET state = EXCLUDED.state, updated_at = NOW()
  `
}
