import { describe, expect, it } from 'vitest'

import { createSnapshotDrainCoordinator } from './snapshotCoordinator'
import type { SnapshotDrainResult } from './snapshotDrain'

const SYNCED: SnapshotDrainResult = {
  ok: true,
  kind: 'synced',
  version: 2,
  pending: 0,
}

describe('snapshot drain coordinator', () => {
  it('serializes concurrent requests and reruns after a write races the active pass', async () => {
    let finishFirst: ((value: SnapshotDrainResult) => void) | undefined
    let calls = 0
    const requestDrain = createSnapshotDrainCoordinator(async () => {
      calls += 1
      if (calls === 1) {
        return new Promise<SnapshotDrainResult>((resolve) => {
          finishFirst = resolve
        })
      }
      return SYNCED
    })

    const first = requestDrain('account-1')
    const raced = requestDrain('account-1')
    expect(raced).toBe(first)
    expect(calls).toBe(1)

    finishFirst?.(SYNCED)
    await expect(first).resolves.toEqual(SYNCED)
    expect(calls).toBe(2)
  })

  it('does not spin while the network is offline', async () => {
    let calls = 0
    const offline: SnapshotDrainResult = { ok: false, kind: 'offline', pending: 1 }
    const requestDrain = createSnapshotDrainCoordinator(async () => {
      calls += 1
      await Promise.resolve()
      return offline
    })

    const first = requestDrain('account-1')
    const raced = requestDrain('account-1')
    await expect(first).resolves.toEqual(offline)
    await expect(raced).resolves.toEqual(offline)
    expect(calls).toBe(1)
  })
})
