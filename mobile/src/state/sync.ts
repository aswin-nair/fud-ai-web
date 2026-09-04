import { accountServicesAvailable, readMobileAccountConfig } from '@/account/config'
import { postAccount } from '@/account/client'
import { acknowledgeMutations, loadDurableAccount } from './durable'
import { loadSessionTokens, saveSessionTokens } from './secrets'
import {
  drainAccountSnapshots,
  type SnapshotDrainResult,
  type SnapshotResponse,
} from './snapshotDrain'
import { runSnapshotDrainWithOneRefresh } from './snapshotAuthRetry'
import { createSnapshotDrainCoordinator } from './snapshotCoordinator'
import type { DurableMutation } from './types'

export async function drainSnapshot(userId: string): Promise<SnapshotDrainResult> {
  const config = readMobileAccountConfig()
  const pending = loadDurableAccount(userId)?.outbox.length ?? 0
  if (!accountServicesAvailable(config) || !config.entitySyncEnabled) {
    return { ok: false, kind: 'disabled', pending }
  }
  if (userId.startsWith('guest:')) return { ok: false, kind: 'disabled', pending }

  let tokens: Awaited<ReturnType<typeof loadSessionTokens>>
  try {
    tokens = await loadSessionTokens()
  } catch {
    return { ok: false, kind: 'auth', pending }
  }
  if (!tokens.token) return { ok: false, kind: 'auth', pending }
  if (tokens.accountId && tokens.accountId !== userId) {
    return { ok: false, kind: 'auth', pending }
  }

  const runPass = (accessToken: string): Promise<SnapshotDrainResult> => {
    // Reload on every pass: a failed pass may already have acknowledged part
    // of the queue before its access token expires.
    const account = loadDurableAccount(userId)
    const request = (method: 'GET' | 'PUT', mutation?: DurableMutation): Promise<SnapshotResponse> => (
      fetch(`${config.apiBaseUrl}/api/state`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        ...(mutation ? {
          body: JSON.stringify({
            state: mutation.state,
            baseVersion: mutation.baseVersion,
            mutationId: mutation.mutationId,
            client: 'mobile',
          }),
        } : {}),
      })
    )

    return drainAccountSnapshots(account, {
      getState: () => request('GET'),
      putState: mutation => request('PUT', mutation),
    }, (mutationId, serverVersion) => {
      acknowledgeMutations(userId, [mutationId], serverVersion)
    })
  }

  return runSnapshotDrainWithOneRefresh({
    userId,
    accessToken: tokens.token,
    refreshToken: tokens.refreshToken,
    runPass,
    refresh: async (refreshToken) => {
      const refreshed = await postAccount('/api/auth/refresh', { refreshToken })
      return refreshed.ok ? refreshed.value : null
    },
    persist: async session => {
      const current = await loadSessionTokens()
      // An in-flight refresh must not recreate a deleted or replaced session.
      if (current.token !== tokens.token || current.refreshToken !== tokens.refreshToken
        || current.accountId !== tokens.accountId) {
        throw new Error('The active session changed during refresh.')
      }
      await saveSessionTokens(session.token, session.refreshToken, session.userId)
    },
  })
}

/** Use this from UI state writes so overlapping renders never upload in parallel. */
export const requestSnapshotDrain = createSnapshotDrainCoordinator(drainSnapshot)
