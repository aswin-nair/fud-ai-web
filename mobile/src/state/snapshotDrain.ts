import type { AppState, DurableAccount, DurableMutation } from './types'

export type SnapshotResponse = {
  status: number
  json: () => Promise<unknown>
}

export type SnapshotTransport = {
  getState: () => Promise<SnapshotResponse>
  putState: (mutation: DurableMutation) => Promise<SnapshotResponse>
}

type SnapshotDrainMetadata = {
  // Kept at the top level for AppProvider's existing remote hydration path.
  // Conflict details intentionally live under `conflict` so a 409 can never
  // be mistaken for a safe server snapshot to install automatically.
  remote?: AppState
  version?: number
}

export type SnapshotDrainResult = SnapshotDrainMetadata & (
  | { ok: true; kind: 'synced'; version: number; pending: 0 }
  | { ok: true; kind: 'remote'; version: number; pending: 0; remote?: AppState }
  | {
      ok: false
      kind: 'conflict'
      pending: number
      conflict?: { remote?: AppState; version: number }
    }
  | {
      ok: false
      kind: 'auth' | 'disabled' | 'offline' | 'retry' | 'invalid-response'
      pending: number
    }
)

type ParsedSnapshot = { version: number; remote?: AppState }

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Partial<AppState>
  return Boolean(
    state.profile
    && state.aiSettings
    && state.gamification
    && Array.isArray(state.foodEntries)
    && Array.isArray(state.weightEntries)
    && Array.isArray(state.exerciseEntries)
    && Array.isArray(state.favoriteMeals)
    && Array.isArray(state.chatMessages),
  )
}

async function parseSnapshot(response: SnapshotResponse): Promise<ParsedSnapshot | null> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return null
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const record = body as { state?: unknown; version?: unknown }
  if (!Number.isSafeInteger(record.version) || (record.version as number) < 0) return null
  if (record.state == null) return { version: record.version as number }
  if (!isAppState(record.state)) return null
  return { version: record.version as number, remote: record.state }
}

function pendingAfter(account: DurableAccount | null, acknowledged: number): number {
  return Math.max(0, (account?.outbox.length ?? 0) - acknowledged)
}

/**
 * Drain a persisted snapshot queue in order. The caller owns storage and
 * acknowledges each successful write synchronously before the next request.
 */
export async function drainAccountSnapshots(
  account: DurableAccount | null,
  transport: SnapshotTransport,
  acknowledge: (mutationId: string, serverVersion: number) => void,
): Promise<SnapshotDrainResult> {
  if (!account?.outbox.length) {
    let response: SnapshotResponse
    try {
      response = await transport.getState()
    } catch {
      return { ok: false, kind: 'offline', pending: 0 }
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, kind: 'auth', pending: 0 }
    }
    if (response.status === 503) return { ok: false, kind: 'disabled', pending: 0 }
    if (response.status !== 200) return { ok: false, kind: 'retry', pending: 0 }
    const parsed = await parseSnapshot(response)
    if (!parsed) return { ok: false, kind: 'invalid-response', pending: 0 }
    return { ok: true, kind: 'remote', version: parsed.version, pending: 0, remote: parsed.remote }
  }

  let acknowledged = 0
  let version = account.serverVersion
  for (const mutation of account.outbox) {
    let response: SnapshotResponse
    try {
      response = await transport.putState(mutation)
    } catch {
      return { ok: false, kind: 'offline', pending: pendingAfter(account, acknowledged) }
    }

    if (response.status === 409) {
      let conflict: ParsedSnapshot | null = null
      try {
        const remote = await transport.getState()
        if (remote.status === 200) conflict = await parseSnapshot(remote)
      } catch {
        // The pending device snapshots remain durable even if conflict detail
        // cannot be refreshed while connectivity is unstable.
      }
      return {
        ok: false,
        kind: 'conflict',
        pending: pendingAfter(account, acknowledged),
        ...(conflict ? { conflict } : {}),
      }
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, kind: 'auth', pending: pendingAfter(account, acknowledged) }
    }
    if (response.status === 503) {
      return { ok: false, kind: 'disabled', pending: pendingAfter(account, acknowledged) }
    }
    if (response.status !== 200) {
      return { ok: false, kind: 'retry', pending: pendingAfter(account, acknowledged) }
    }

    const parsed = await parseSnapshot(response)
    if (!parsed || parsed.version !== mutation.baseVersion + 1) {
      return { ok: false, kind: 'invalid-response', pending: pendingAfter(account, acknowledged) }
    }
    acknowledge(mutation.mutationId, parsed.version)
    acknowledged += 1
    version = parsed.version
  }

  return { ok: true, kind: 'synced', version, pending: 0 }
}
