import { describe, expect, it } from 'vitest'

import { freshState } from './defaults'
import { acknowledgeDurableMutation, canInstallRemoteSnapshot, queueDurableMutation } from './durablePolicy'
import type { DurableAccount } from './types'

const USER = '00000000-0000-4000-8000-000000000001'
const FIRST = '10000000-0000-4000-8000-000000000001'
const SECOND = '10000000-0000-4000-8000-000000000002'

function account(serverVersion = 4): DurableAccount {
  return {
    userId: USER,
    state: freshState(),
    serverVersion,
    outbox: [],
    updatedAt: '2026-09-02T08:00:00.000Z',
  }
}

describe('durable account snapshot policy', () => {
  it('rejects remote hydration after deletion, queued edits, or a newer local revision', () => {
    expect(canInstallRemoteSnapshot(null, 5)).toBe(false)
    expect(canInstallRemoteSnapshot(account(6), 5)).toBe(false)
    expect(canInstallRemoteSnapshot(account(4), Number.NaN)).toBe(false)
    const queued = queueDurableMutation(account(), freshState(), { force: true })
    expect(canInstallRemoteSnapshot(queued, 5)).toBe(false)
    expect(canInstallRemoteSnapshot(account(4), 5)).toBe(true)
  })

  it('persists several offline edits as a versioned queue without private AI keys', () => {
    const firstState = freshState()
    firstState.profile.name = 'Ada'
    firstState.aiSettings.apiKey = 'sk-private'
    const first = queueDurableMutation(account(), firstState, {
      mutationId: FIRST,
      createdAt: '2026-09-02T08:01:00.000Z',
    })

    const secondState = { ...first.state, profile: { ...first.state.profile, weightKg: 68 } }
    const second = queueDurableMutation(first, secondState, {
      mutationId: SECOND,
      createdAt: '2026-09-02T08:02:00.000Z',
    })
    const restored = JSON.parse(JSON.stringify(second)) as DurableAccount

    expect(restored.outbox.map(item => item.baseVersion)).toEqual([4, 5])
    expect(restored.outbox.map(item => item.mutationId)).toEqual([FIRST, SECOND])
    expect(restored.state.profile.weightKg).toBe(68)
    expect(JSON.stringify(restored)).not.toContain('sk-private')
  })

  it('can queue the initial account snapshot even after its local row is created', () => {
    const initial = freshState()
    initial.profile.name = 'Ada'
    const queued = queueDurableMutation({ ...account(0), state: initial }, initial, {
      force: true,
      mutationId: FIRST,
    })

    expect(queued.outbox).toHaveLength(1)
    expect(queued.outbox[0].baseVersion).toBe(0)
  })

  it('reconciles acknowledgements in queue order without dropping later work', () => {
    const firstState = freshState()
    firstState.profile.name = 'Ada'
    const first = queueDurableMutation(account(), firstState, { mutationId: FIRST })
    const second = queueDurableMutation(first, {
      ...first.state,
      profile: { ...first.state.profile, weightKg: 68 },
    }, { mutationId: SECOND })

    const afterFirst = acknowledgeDurableMutation(second, FIRST, 5)
    expect(afterFirst.serverVersion).toBe(5)
    expect(afterFirst.outbox.map(item => item.mutationId)).toEqual([SECOND])
    expect(afterFirst.state.profile.weightKg).toBe(68)

    const complete = acknowledgeDurableMutation(afterFirst, SECOND, 6)
    expect(complete.serverVersion).toBe(6)
    expect(complete.outbox).toEqual([])
  })

  it('does not accept a malformed acknowledgement that could discard an offline edit', () => {
    const changed = freshState()
    changed.profile.name = 'Ada'
    const queued = queueDurableMutation(account(), changed, { mutationId: FIRST })
    expect(() => acknowledgeDurableMutation(queued, FIRST, 4)).toThrow(/expected version/i)
    expect(acknowledgeDurableMutation(queued, SECOND, 5)).toBe(queued)
  })
})
