import { createHash } from 'node:crypto'
import { getDb, asRows } from './db.js'
import { isCanonicalUuid } from './identifiers.js'

export interface LoadedUserState {
  state: Record<string, unknown>
  version: number
}

export class StateVersionConflict extends Error {
  constructor() {
    super('State version conflict')
    this.name = 'StateVersionConflict'
  }
}

export class StateMutationConflict extends Error {
  constructor() {
    super('Mutation ID was already used for a different state write')
    this.name = 'StateMutationConflict'
  }
}

/** Defense in depth: clients must not be able to persist BYOK credentials. */
export function stripPrivateStateSecrets(
  state: Record<string, unknown>,
): Record<string, unknown> {
  const aiSettings = state.aiSettings
  if (!aiSettings || typeof aiSettings !== 'object' || Array.isArray(aiSettings)) return state

  const { apiKey: _apiKey, ...safeAISettings } = aiSettings as Record<string, unknown>
  return { ...state, aiSettings: safeAISettings }
}

export async function loadUserState(userId: string): Promise<LoadedUserState | null> {
  const sql = getDb()
  // Purge credentials written by older clients before returning the state.
  await sql`
    UPDATE user_states
    SET state = state #- '{aiSettings,apiKey}'::text[],
        version = version + 1,
        updated_at = NOW()
    WHERE user_id = ${userId}::uuid
      AND state #> '{aiSettings,apiKey}'::text[] IS NOT NULL
  `
  const rows = asRows<{ state: Record<string, unknown>; version: number | string }>(
    await sql`
    SELECT state, version FROM user_states WHERE user_id = ${userId}::uuid LIMIT 1
  `,
  )
  const loaded = rows[0]
  if (!loaded) return null
  const version = Number(loaded.version)
  if (!Number.isSafeInteger(version) || version < 0) {
    throw new Error('Stored state version is invalid')
  }
  const safeState = stripPrivateStateSecrets(loaded.state)
  // Registration historically creates a version-0 placeholder row containing
  // `{}`. Treat it as an account with no state so the client can initialize a
  // valid fresh snapshot instead of rejecting the placeholder contract.
  if (version === 0 && Object.keys(safeState).length === 0) return null
  return {
    state: safeState,
    version,
  }
}

export async function saveUserState(
  userId: string,
  state: Record<string, unknown>,
  baseVersion: number,
  mutationId: string,
): Promise<{ version: number; replayed: boolean }> {
  if (!isCanonicalUuid(mutationId)) throw new Error('Mutation ID must be a canonical UUID')
  const sql = getDb()
  const safeState = stripPrivateStateSecrets(state)
  const requestHash = stateMutationHash(safeState, baseVersion)
  const rows = asRows<{ outcome: string; resulting_version: number | string | null }>(await sql`
    SELECT outcome, resulting_version
    FROM save_user_state_idempotent(
      ${userId}::uuid,
      ${JSON.stringify(safeState)}::jsonb,
      ${baseVersion}::bigint,
      ${mutationId}::uuid,
      ${requestHash}
    )
  `)
  const result = rows[0]
  if (!result) throw new Error('State write did not return a result')
  if (result.outcome === 'version_conflict') throw new StateVersionConflict()
  if (result.outcome === 'mutation_conflict') throw new StateMutationConflict()
  if (result.outcome !== 'saved' && result.outcome !== 'replayed') {
    throw new Error('State write returned an invalid outcome')
  }
  const version = Number(result.resulting_version)
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error('Saved state version is invalid')
  }
  return { version, replayed: result.outcome === 'replayed' }
}

function canonicalJson(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot hash a non-finite number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>
    return `{${Object.keys(object).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(object[key])}`
    )).join(',')}}`
  }
  throw new Error('Cannot hash a non-JSON value')
}

export function stateMutationHash(state: Record<string, unknown>, baseVersion: number): string {
  return createHash('sha256')
    .update(`${baseVersion}\n${canonicalJson(state)}`, 'utf8')
    .digest('hex')
}
