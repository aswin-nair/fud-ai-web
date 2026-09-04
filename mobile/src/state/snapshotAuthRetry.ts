import type { SnapshotDrainResult } from './snapshotDrain'

export type RefreshedSnapshotSession = {
  token: string
  refreshToken: string
  userId: string
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

/**
 * Accept only a complete rotated mobile session for the account being drained.
 * A refresh response for another account must never be installed on this device.
 */
export function parseRefreshedSnapshotSession(
  value: unknown,
  expectedUserId: string,
): RefreshedSnapshotSession | null {
  const session = record(value)
  const user = record(session?.user)
  const token = typeof session?.token === 'string' ? session.token.trim() : ''
  const refreshToken = typeof session?.refreshToken === 'string'
    ? session.refreshToken.trim()
    : ''
  const userId = typeof user?.sub === 'string' ? user.sub : ''

  if (!token || !refreshToken || userId !== expectedUserId) return null
  return { token, refreshToken, userId }
}

export async function runSnapshotDrainWithOneRefresh(input: {
  userId: string
  accessToken: string
  refreshToken: string | null
  /** Each call must load the current durable queue before draining it. */
  runPass: (accessToken: string) => Promise<SnapshotDrainResult>
  refresh: (refreshToken: string) => Promise<unknown>
  persist: (session: RefreshedSnapshotSession) => Promise<void>
}): Promise<SnapshotDrainResult> {
  const first = await input.runPass(input.accessToken)
  if (first.ok || first.kind !== 'auth' || !input.refreshToken) return first

  let payload: unknown
  try {
    payload = await input.refresh(input.refreshToken)
  } catch {
    return first
  }

  const session = parseRefreshedSnapshotSession(payload, input.userId)
  if (!session) return first

  try {
    await input.persist(session)
  } catch {
    return first
  }

  // Re-enter through runPass instead of continuing the old iterator. The first
  // pass may already have acknowledged a prefix of the persisted queue.
  return input.runPass(session.token)
}
