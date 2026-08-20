import { payloadContainsSecret } from '@fud-ai/contracts'

export const MAX_OUTBOX_UPLOAD = 20

export type OutboxStatus = 'pending' | 'inflight' | 'acked' | 'conflict' | 'auth_failed'

export type OutboxRow = {
  mutationId: string
  userId: string
  status: OutboxStatus
  entityJson: string
  nextAttemptAt: string
  attemptCount: number
}

export type DrainDecision =
  | { action: 'skip'; reason: 'sync-disabled' | 'auth-required' | 'empty' | 'auth-failed' | 'conflict' | 'backoff' }
  | { action: 'upload'; rows: OutboxRow[] }

export function nextBackoffSeconds(attemptCount: number): number {
  return Math.min(300, 2 ** Math.max(attemptCount, 0))
}

export function nextAttemptAt(now: Date, attemptCount: number): string {
  return new Date(now.getTime() + nextBackoffSeconds(attemptCount) * 1000).toISOString()
}

export function outboxEntityContainsSecret(entityJson: string): boolean {
  try {
    const value = JSON.parse(entityJson) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return true
    const payload = (value as { payload?: unknown }).payload
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return payloadContainsSecret(payload as Record<string, unknown>)
    }
    return payloadContainsSecret(value as Record<string, unknown>)
  } catch {
    return true
  }
}

export function decideDrain(input: {
  syncEnabled: boolean
  accessToken: string | null
  now: Date
  rows: OutboxRow[]
}): DrainDecision {
  if (!input.syncEnabled) return { action: 'skip', reason: 'sync-disabled' }
  if (!input.accessToken) return { action: 'skip', reason: 'auth-required' }

  const due: OutboxRow[] = []
  for (const row of input.rows) {
    if (row.status === 'acked') continue
    if (row.status === 'auth_failed') return { action: 'skip', reason: 'auth-failed' }
    if (row.status === 'conflict') return { action: 'skip', reason: 'conflict' }
    if (outboxEntityContainsSecret(row.entityJson)) return { action: 'skip', reason: 'conflict' }
    if (new Date(row.nextAttemptAt).getTime() > input.now.getTime()) {
      return due.length > 0 ? { action: 'upload', rows: due } : { action: 'skip', reason: 'backoff' }
    }
    if (row.status === 'pending' || row.status === 'inflight') {
      due.push(row)
      if (due.length >= MAX_OUTBOX_UPLOAD) break
    }
  }
  return due.length > 0 ? { action: 'upload', rows: due } : { action: 'skip', reason: 'empty' }
}

export function interpretSyncStatus(status: number): 'ok' | 'auth' | 'conflict' | 'disabled' | 'retry' {
  if (status === 200) return 'ok'
  if (status === 401 || status === 403) return 'auth'
  if (status === 409) return 'conflict'
  if (status === 503) return 'disabled'
  return 'retry'
}
