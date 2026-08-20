import { createHash } from 'node:crypto'
import {
  canonicalJson,
  validateEntityMutation,
  type EntityMutation,
  type ServerAcknowledgement,
} from '@fud-ai/contracts'
import { asRows, getDb } from './db.js'
import { isCanonicalUuid } from './identifiers.js'

export class EntityMutationConflict extends Error {
  constructor() {
    super('Mutation ID was already used for a different entity write')
    this.name = 'EntityMutationConflict'
  }
}

export class EntityVersionConflict extends Error {
  constructor() {
    super('Entity cursor conflict')
    this.name = 'EntityVersionConflict'
  }
}

export function entityMutationHash(mutation: EntityMutation): string {
  return createHash('sha256').update(canonicalJson(mutation), 'utf8').digest('hex')
}

export async function applyEntityMutation(
  userId: string,
  mutation: EntityMutation,
): Promise<ServerAcknowledgement> {
  if (!isCanonicalUuid(userId) || !isCanonicalUuid(mutation.mutationId)) {
    throw new Error('Account and mutation IDs must be canonical UUIDs')
  }
  const valid = validateEntityMutation(mutation)
  if (!valid.ok) throw new Error(valid.error)
  const sql = getDb()
  const hash = entityMutationHash(mutation)
  const entity = mutation.entity
  const payload = mutation.kind === 'upsert' && 'payload' in entity ? entity.payload : {}
  const localDate = mutation.kind === 'upsert' && 'localDate' in entity ? entity.localDate : null
  const timeZone = mutation.kind === 'upsert' && 'timeZone' in entity ? entity.timeZone : 'UTC'
  const createdAt = mutation.kind === 'upsert' && 'createdAt' in entity ? entity.createdAt : entity.deletedAt
  const updatedAt = mutation.kind === 'upsert' && 'updatedAt' in entity ? entity.updatedAt : entity.deletedAt
  const rows = asRows<{ outcome: string; resulting_cursor: number | string | null }>(await sql`
    SELECT outcome, resulting_cursor
    FROM apply_entity_mutation(
      ${userId}::uuid,
      ${mutation.mutationId}::uuid,
      ${hash},
      ${mutation.kind},
      ${entity.entityType},
      ${entity.entityId},
      ${mutation.deviceId},
      ${localDate},
      ${timeZone},
      ${createdAt}::timestamptz,
      ${updatedAt}::timestamptz,
      ${entity.deletedAt}::timestamptz,
      ${entity.recordVersion}::bigint,
      ${JSON.stringify(payload)}::jsonb
    )
  `)
  const result = rows[0]
  if (!result) throw new Error('Entity write did not return a result')
  if (result.outcome === 'version_conflict') throw new EntityVersionConflict()
  if (result.outcome === 'mutation_conflict') throw new EntityMutationConflict()
  if (result.outcome !== 'saved' && result.outcome !== 'replayed') {
    throw new Error('Entity write returned an invalid outcome')
  }
  const cursor = Number(result.resulting_cursor)
  if (!Number.isSafeInteger(cursor) || cursor < 1) throw new Error('Saved entity cursor is invalid')
  return { mutationId: mutation.mutationId, cursor, replayed: result.outcome === 'replayed' }
}
