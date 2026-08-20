import { isDeviceId } from './calendarContext.js'
import {
  validateAccountEntity,
  validateTombstone,
  type AccountEntity,
  type ContractValidation,
  type EntityTombstone,
} from './entities.js'

const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
export const MAX_MUTATION_BATCH = 200

export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && CANONICAL_UUID.test(value)
}

export type EntityOperationKind = 'upsert' | 'delete'

export interface EntityMutation {
  contractVersion: 1
  mutationId: string
  deviceId: string
  baseCursor: number
  kind: EntityOperationKind
  entity: AccountEntity | EntityTombstone
}

export interface DeviceCursor {
  deviceId: string
  cursor: number
}

export interface ServerAcknowledgement {
  mutationId: string
  cursor: number
  replayed: boolean
}

function row(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function validateEntityMutation(value: unknown): ContractValidation {
  if (!row(value)) return { ok: false, error: 'Mutation must be an object' }
  if (value.contractVersion !== 1) return { ok: false, error: 'Unsupported contract version' }
  if (!isCanonicalUuid(value.mutationId)) return { ok: false, error: 'Mutation ID must be a canonical UUID' }
  if (!isDeviceId(value.deviceId)) return { ok: false, error: 'Invalid device id' }
  if (!Number.isSafeInteger(value.baseCursor) || (value.baseCursor as number) < 0) {
    return { ok: false, error: 'Base cursor must be a non-negative integer' }
  }
  if (value.kind !== 'upsert' && value.kind !== 'delete') {
    return { ok: false, error: 'Mutation kind must be upsert or delete' }
  }
  if (!row(value.entity)) return { ok: false, error: 'Mutation entity is required' }
  if (value.deviceId !== value.entity.deviceId) {
    return { ok: false, error: 'Mutation device must match the entity device' }
  }
  if (value.kind === 'delete') return validateTombstone(value.entity)
  return validateAccountEntity(value.entity)
}

export function validateMutationBatch(value: unknown): ContractValidation {
  if (!Array.isArray(value)) return { ok: false, error: 'Mutation batch must be an array' }
  if (value.length === 0 || value.length > MAX_MUTATION_BATCH) {
    return { ok: false, error: 'Mutation batch is empty or too large' }
  }
  const seen = new Set<string>()
  for (const item of value) {
    const result = validateEntityMutation(item)
    if (!result.ok) return result
    const id = (item as EntityMutation).mutationId
    if (seen.has(id)) return { ok: false, error: 'Mutation ID is repeated in the batch' }
    seen.add(id)
  }
  return { ok: true }
}
