import { sqlite } from '@/db/client'
import {
  acknowledgeDurableMutation,
  durableStateWithoutSecrets,
  queueDurableMutation,
} from './durablePolicy'
import type { AppState, DurableAccount, DurableMutation } from './types'

const TABLE = `
CREATE TABLE IF NOT EXISTS app_state_accounts (
  user_id TEXT PRIMARY KEY NOT NULL,
  state_json TEXT NOT NULL,
  server_version INTEGER NOT NULL DEFAULT 0,
  outbox_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
)`

let ready = false

function ensureTable() {
  if (ready) return
  sqlite.execSync(TABLE)
  ready = true
}

function parseAccount(row: { user_id: string; state_json: string; server_version: number; outbox_json: string; updated_at: string }): DurableAccount {
  return {
    userId: row.user_id,
    state: JSON.parse(row.state_json) as AppState,
    serverVersion: row.server_version,
    outbox: JSON.parse(row.outbox_json) as DurableMutation[],
    updatedAt: row.updated_at,
  }
}

export function loadDurableAccount(userId: string): DurableAccount | null {
  ensureTable()
  const row = sqlite.getFirstSync<{
    user_id: string
    state_json: string
    server_version: number
    outbox_json: string
    updated_at: string
  }>('SELECT user_id, state_json, server_version, outbox_json, updated_at FROM app_state_accounts WHERE user_id = ?', [userId])
  return row ? parseAccount(row) : null
}

export function saveDurableSnapshot(userId: string, state: AppState, serverVersion?: number): DurableAccount {
  ensureTable()
  const existing = loadDurableAccount(userId)
  const next: DurableAccount = {
    userId,
    state: durableStateWithoutSecrets(state),
    serverVersion: serverVersion ?? existing?.serverVersion ?? 0,
    outbox: existing?.outbox ?? [],
    updatedAt: new Date().toISOString(),
  }
  sqlite.runSync(
    `INSERT INTO app_state_accounts (user_id, state_json, server_version, outbox_json, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       state_json = excluded.state_json,
       server_version = excluded.server_version,
       outbox_json = excluded.outbox_json,
       updated_at = excluded.updated_at`,
    [next.userId, JSON.stringify(next.state), next.serverVersion, JSON.stringify(next.outbox), next.updatedAt],
  )
  return next
}

export function enqueueMutation(userId: string, state: AppState): DurableAccount {
  const loaded = loadDurableAccount(userId)
  const existing = loaded ?? saveDurableSnapshot(userId, state)
  const next = queueDurableMutation(existing, state, { force: !loaded })
  if (next === existing) return existing
  sqlite.runSync(
    `UPDATE app_state_accounts SET state_json = ?, outbox_json = ?, updated_at = ? WHERE user_id = ?`,
    [JSON.stringify(next.state), JSON.stringify(next.outbox), next.updatedAt, userId],
  )
  return next
}

export function acknowledgeMutations(userId: string, ids: string[], serverVersion: number): void {
  const existing = loadDurableAccount(userId)
  if (!existing || ids.length === 0) return
  if (ids.length !== 1) throw new Error('Snapshot mutations must be acknowledged in order.')
  const next = acknowledgeDurableMutation(existing, ids[0], serverVersion)
  if (next === existing) return
  sqlite.runSync(
    `UPDATE app_state_accounts SET server_version = ?, outbox_json = ?, updated_at = ? WHERE user_id = ?`,
    [next.serverVersion, JSON.stringify(next.outbox), next.updatedAt, userId],
  )
}

export function clearDurableAccount(userId: string): void {
  ensureTable()
  sqlite.runSync('DELETE FROM app_state_accounts WHERE user_id = ?', [userId])
}

export function clearAllDurableAccounts(): void {
  ensureTable()
  sqlite.runSync('DELETE FROM app_state_accounts')
}

export function durableAccountIds(): string[] {
  ensureTable()
  return sqlite.getAllSync<{ user_id: string }>('SELECT user_id FROM app_state_accounts')
    .map(row => row.user_id)
}

export function pendingCount(userId: string): number {
  return loadDurableAccount(userId)?.outbox.length ?? 0
}
