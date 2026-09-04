import { describe, expect, it } from 'vitest'

import { freshState } from './defaults'
import { acknowledgeDurableMutation, queueDurableMutation } from './durablePolicy'
import { drainAccountSnapshots, type SnapshotResponse } from './snapshotDrain'
import type { DurableAccount } from './types'

const USER = '00000000-0000-4000-8000-000000000001'
const FIRST = '10000000-0000-4000-8000-000000000001'
const SECOND = '10000000-0000-4000-8000-000000000002'

function response(status: number, body: unknown): SnapshotResponse {
  return { status, json: async () => body }
}

function queuedAccount(): DurableAccount {
  const initial: DurableAccount = {
    userId: USER,
    state: freshState(),
    serverVersion: 4,
    outbox: [],
    updatedAt: '2026-09-02T08:00:00.000Z',
  }
  const named = freshState()
  named.profile.name = 'Ada'
  const first = queueDurableMutation(initial, named, { mutationId: FIRST })
  return queueDurableMutation(first, {
    ...first.state,
    profile: { ...first.state.profile, weightKg: 68 },
  }, { mutationId: SECOND })
}

describe('durable account snapshot drain', () => {
  it('keeps the unsent tail across an offline interruption and drains it after restart', async () => {
    let ledger = queuedAccount()
    let uploads = 0
    const firstRun = await drainAccountSnapshots(ledger, {
      getState: async () => response(200, { state: ledger.state, version: ledger.serverVersion }),
      putState: async (mutation) => {
        uploads += 1
        if (uploads === 2) throw new Error('offline')
        return response(200, { version: mutation.baseVersion + 1 })
      },
    }, (mutationId, version) => {
      ledger = acknowledgeDurableMutation(ledger, mutationId, version)
    })

    expect(firstRun).toEqual({ ok: false, kind: 'offline', pending: 1 })
    expect(ledger.serverVersion).toBe(5)
    expect(ledger.outbox.map(item => item.mutationId)).toEqual([SECOND])

    // SQLite stores this account as JSON; round-tripping represents a cold
    // restart before connectivity returns.
    ledger = JSON.parse(JSON.stringify(ledger)) as DurableAccount
    const secondRun = await drainAccountSnapshots(ledger, {
      getState: async () => response(200, { state: ledger.state, version: ledger.serverVersion }),
      putState: async (mutation) => response(200, { version: mutation.baseVersion + 1 }),
    }, (mutationId, version) => {
      ledger = acknowledgeDurableMutation(ledger, mutationId, version)
    })

    expect(secondRun).toEqual({ ok: true, kind: 'synced', version: 6, pending: 0 })
    expect(ledger.serverVersion).toBe(6)
    expect(ledger.outbox).toEqual([])
    expect(ledger.state.profile.weightKg).toBe(68)
  })

  it('surfaces a remote conflict without replacing or deleting the device queue', async () => {
    let ledger = queuedAccount()
    const before = JSON.stringify(ledger)
    const remote = freshState()
    remote.profile.name = 'Grace'

    const result = await drainAccountSnapshots(ledger, {
      getState: async () => response(200, { state: remote, version: 9 }),
      putState: async () => response(409, { error: 'conflict' }),
    }, (mutationId, version) => {
      ledger = acknowledgeDurableMutation(ledger, mutationId, version)
    })

    expect(result).toMatchObject({
      ok: false,
      kind: 'conflict',
      pending: 2,
      conflict: { version: 9, remote: { profile: { name: 'Grace' } } },
    })
    expect(JSON.stringify(ledger)).toBe(before)
  })

  it('does not acknowledge a success response with an invalid version', async () => {
    let ledger = queuedAccount()
    const result = await drainAccountSnapshots(ledger, {
      getState: async () => response(200, { state: ledger.state, version: ledger.serverVersion }),
      putState: async () => response(200, { version: 999 }),
    }, (mutationId, version) => {
      ledger = acknowledgeDurableMutation(ledger, mutationId, version)
    })

    expect(result).toEqual({ ok: false, kind: 'invalid-response', pending: 2 })
    expect(ledger.outbox).toHaveLength(2)
  })
})
