import { describe, expect, it, vi } from 'vitest'

import {
  parseRefreshedSnapshotSession,
  runSnapshotDrainWithOneRefresh,
} from './snapshotAuthRetry'
import type { SnapshotDrainResult } from './snapshotDrain'

const USER = '00000000-0000-4000-8000-000000000001'

function auth(pending: number): SnapshotDrainResult {
  return { ok: false, kind: 'auth', pending }
}

describe('legacy snapshot auth retry', () => {
  it('installs a matching rotated session and reloads the queue before retrying', async () => {
    let durableQueue = ['already-acked', 'still-pending']
    const observedQueues: string[][] = []
    const persist = vi.fn(async () => undefined)

    const result = await runSnapshotDrainWithOneRefresh({
      userId: USER,
      accessToken: 'expired-access',
      refreshToken: 'current-refresh',
      runPass: async (token) => {
        // This models loadDurableAccount at the start of every pass.
        observedQueues.push([...durableQueue])
        if (token === 'expired-access') {
          durableQueue = durableQueue.slice(1)
          return auth(1)
        }
        durableQueue = []
        return { ok: true, kind: 'synced', version: 2, pending: 0 }
      },
      refresh: async () => ({
        token: 'rotated-access',
        refreshToken: 'rotated-refresh',
        user: { sub: USER },
      }),
      persist,
    })

    expect(result).toEqual({ ok: true, kind: 'synced', version: 2, pending: 0 })
    expect(observedQueues).toEqual([
      ['already-acked', 'still-pending'],
      ['still-pending'],
    ])
    expect(persist).toHaveBeenCalledWith({
      token: 'rotated-access',
      refreshToken: 'rotated-refresh',
      userId: USER,
    })
  })

  it('rejects a refreshed session for another account', async () => {
    const runPass = vi.fn(async () => auth(1))
    const persist = vi.fn(async () => undefined)

    const result = await runSnapshotDrainWithOneRefresh({
      userId: USER,
      accessToken: 'expired-access',
      refreshToken: 'current-refresh',
      runPass,
      refresh: async () => ({
        token: 'other-access',
        refreshToken: 'other-refresh',
        user: { sub: '00000000-0000-4000-8000-000000000002' },
      }),
      persist,
    })

    expect(result).toEqual(auth(1))
    expect(runPass).toHaveBeenCalledTimes(1)
    expect(persist).not.toHaveBeenCalled()
  })

  it('refreshes at most once when the rotated access token is also rejected', async () => {
    const refresh = vi.fn(async () => ({
      token: 'rotated-access',
      refreshToken: 'rotated-refresh',
      user: { sub: USER },
    }))

    const result = await runSnapshotDrainWithOneRefresh({
      userId: USER,
      accessToken: 'expired-access',
      refreshToken: 'current-refresh',
      runPass: async () => auth(2),
      refresh,
      persist: async () => undefined,
    })

    expect(result).toEqual(auth(2))
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('requires both rotated tokens and an exact account match', () => {
    expect(parseRefreshedSnapshotSession({
      token: 'access',
      refreshToken: '',
      user: { sub: USER },
    }, USER)).toBeNull()
    expect(parseRefreshedSnapshotSession({
      token: 'access',
      refreshToken: 'refresh',
      user: { sub: USER },
    }, USER)).toEqual({ token: 'access', refreshToken: 'refresh', userId: USER })
  })
})
