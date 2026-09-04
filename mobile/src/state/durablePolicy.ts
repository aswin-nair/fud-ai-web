import type { AppState, DurableAccount, DurableMutation } from './types'

type QueueOptions = {
  createdAt?: string
  force?: boolean
  mutationId?: string
}

function validVersion(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}

export function durableStateWithoutSecrets(state: AppState): AppState {
  return { ...state, aiSettings: { ...state.aiSettings, apiKey: '' } }
}

/** Never hydrate over queued edits, a deleted account, or a newer local revision. */
export function canInstallRemoteSnapshot(account: DurableAccount | null, version: number): boolean {
  return Boolean(account && account.outbox.length === 0
    && validVersion(version) && version >= account.serverVersion)
}

/**
 * Add a full-state mutation without changing the supplied account object.
 * Pending snapshots form an optimistic-version chain so several offline edits
 * can be replayed in order after connectivity returns.
 */
export function queueDurableMutation(
  account: DurableAccount,
  state: AppState,
  options: QueueOptions = {},
): DurableAccount {
  const safeState = durableStateWithoutSecrets(state)
  if (!options.force && JSON.stringify(account.state) === JSON.stringify(safeState)) return account

  const previous = account.outbox.at(-1)
  const baseVersion = previous ? previous.baseVersion + 1 : account.serverVersion
  if (!validVersion(baseVersion)) throw new Error('The queued base version is invalid.')

  const createdAt = options.createdAt ?? new Date().toISOString()
  const mutation: DurableMutation = {
    mutationId: options.mutationId ?? crypto.randomUUID(),
    userId: account.userId,
    baseVersion,
    state: safeState,
    createdAt,
  }

  return {
    ...account,
    state: safeState,
    outbox: [...account.outbox, mutation],
    updatedAt: createdAt,
  }
}

/** A state write always advances the snapshot endpoint by exactly one version. */
export function acknowledgeDurableMutation(
  account: DurableAccount,
  mutationId: string,
  serverVersion: number,
  acknowledgedAt = new Date().toISOString(),
): DurableAccount {
  const mutation = account.outbox[0]
  if (!mutation || mutation.mutationId !== mutationId) return account
  if (!validVersion(serverVersion) || serverVersion !== mutation.baseVersion + 1) {
    throw new Error('Mutation acknowledgement did not advance the expected version.')
  }

  return {
    ...account,
    serverVersion,
    outbox: account.outbox.slice(1),
    updatedAt: acknowledgedAt,
  }
}
