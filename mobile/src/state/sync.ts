import { readMobileAccountConfig } from '@/account/config'
import { acknowledgeMutations, loadDurableAccount } from './durable'
import { loadSessionTokens } from './secrets'
import type { AppState } from './types'

export async function drainSnapshot(userId: string): Promise<{ ok: boolean; version?: number; remote?: AppState }> {
  const config = readMobileAccountConfig()
  if (!config.mobileAuthEnabled || !config.apiBaseUrl) return { ok: false }
  if (userId.startsWith('guest:')) return { ok: false }

  const tokens = await loadSessionTokens()
  if (!tokens.token) return { ok: false }

  const account = loadDurableAccount(userId)
  if (!account?.outbox.length) {
    const loaded = await getRemote(config.apiBaseUrl, tokens.token)
    return loaded
  }

  for (const mutation of account.outbox) {
    const response = await fetch(`${config.apiBaseUrl}/api/state`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.token}`,
      },
      body: JSON.stringify({
        state: mutation.state,
        baseVersion: mutation.baseVersion,
        mutationId: mutation.mutationId,
        client: 'mobile',
      }),
    })
    if (response.status === 409) {
      const remote = await getRemote(config.apiBaseUrl, tokens.token)
      return remote
    }
    if (!response.ok) return { ok: false }
    const body = await response.json() as { version?: number }
    acknowledgeMutations(userId, [mutation.mutationId], body.version ?? mutation.baseVersion + 1)
  }
  return { ok: true, version: loadDurableAccount(userId)?.serverVersion }
}

async function getRemote(baseUrl: string, token: string): Promise<{ ok: boolean; version?: number; remote?: AppState }> {
  const response = await fetch(`${baseUrl}/api/state`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return { ok: false }
  const body = await response.json() as { state?: AppState; version?: number }
  return { ok: true, remote: body.state, version: body.version }
}
