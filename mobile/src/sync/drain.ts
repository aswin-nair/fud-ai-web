import { validateEntityMutation, type EntityMutation, type ServerAcknowledgement } from '@fud-ai/contracts'

import { decideDrain, interpretSyncStatus, type OutboxRow } from './outboxPolicy'

export type DrainTransport = {
  postMutations: (mutations: EntityMutation[]) => Promise<{ status: number; body: unknown }>
}

export function mutationsFromRows(rows: OutboxRow[]): EntityMutation[] {
  const mutations: EntityMutation[] = []
  for (const row of rows) {
    const entity = JSON.parse(row.entityJson) as EntityMutation['entity']
    const mutation: EntityMutation = {
      contractVersion: 1,
      mutationId: row.mutationId,
      deviceId: entity.deviceId,
      baseCursor: 0,
      kind: 'payload' in entity ? 'upsert' : 'delete',
      entity,
    }
    if (!validateEntityMutation(mutation).ok) return []
    mutations.push(mutation)
  }
  return mutations
}

export async function drainOnce(input: {
  syncEnabled: boolean
  accessToken: string | null
  now: Date
  rows: OutboxRow[]
  transport: DrainTransport
}): Promise<
  | { action: 'skip'; reason: 'sync-disabled' | 'auth-required' | 'empty' | 'auth-failed' | 'conflict' | 'backoff' }
  | { action: 'ok'; acks: ServerAcknowledgement[] }
  | { action: 'auth' | 'conflict' | 'disabled' | 'retry'; mutationId: string | null }
> {
  const decision = decideDrain({
    syncEnabled: input.syncEnabled,
    accessToken: input.accessToken,
    now: input.now,
    rows: input.rows,
  })
  if (decision.action === 'skip') return decision
  const mutations = mutationsFromRows(decision.rows)
  if (mutations.length === 0) return { action: 'skip', reason: 'conflict' }
  const response = await input.transport.postMutations(mutations)
  const kind = interpretSyncStatus(response.status)
  if (kind === 'ok') {
    const acks = Array.isArray((response.body as { acks?: unknown }).acks)
      ? (response.body as { acks: ServerAcknowledgement[] }).acks
      : []
    return { action: 'ok', acks }
  }
  return {
    action: kind,
    mutationId: decision.rows[0]?.mutationId ?? null,
  }
}
