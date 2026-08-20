import { readMobileAccountConfig } from './config'
import { MOBILE_AUTH_UNAVAILABLE_MESSAGE } from './sessionPolicy'

export type AccountUser = {
  sub: string
  email: string
  name: string
  provider: 'email' | 'google'
}

export type MobileSessionResponse = {
  token: string
  user: AccountUser
  refreshToken: string
}

export type AccountClientResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string }

export type AccountFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ status: number; json: () => Promise<unknown> }>

function publicError(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fallback
  const error = (body as { error?: unknown }).error
  return typeof error === 'string' && error.length > 0 && error.length <= 200 ? error : fallback
}

export async function postAccount(
  path: string,
  body: Record<string, unknown>,
  options: {
    method?: 'POST' | 'DELETE'
    accessToken?: string | null
    fetchImpl?: AccountFetch
    env?: Record<string, string | undefined>
  } = {},
): Promise<AccountClientResult<unknown>> {
  const config = readMobileAccountConfig(options.env)
  if (!config.mobileAuthEnabled || !config.apiBaseUrl) {
    return { ok: false, status: 503, error: MOBILE_AUTH_UNAVAILABLE_MESSAGE }
  }

  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as AccountFetch)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`

  let response: { status: number; json: () => Promise<unknown> }
  try {
    response = await fetchImpl(`${config.apiBaseUrl}${path}`, {
      method: options.method ?? 'POST',
      headers,
      body: JSON.stringify({ ...body, client: 'mobile' }),
    })
  } catch {
    return { ok: false, status: 0, error: 'The network is unavailable. Try again when you are back online.' }
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (response.status >= 200 && response.status < 300) return { ok: true, value: payload }
  return {
    ok: false,
    status: response.status,
    error: publicError(payload, response.status === 409
      ? 'An account already exists with a different sign-in method.'
      : 'The request could not be completed.'),
  }
}

export function parseMobileSession(value: unknown): MobileSessionResponse | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const user = record.user
  if (typeof record.token !== 'string' || typeof record.refreshToken !== 'string') return null
  if (!user || typeof user !== 'object' || Array.isArray(user)) return null
  const account = user as Record<string, unknown>
  if (typeof account.sub !== 'string' || typeof account.email !== 'string' || typeof account.name !== 'string') {
    return null
  }
  if (account.provider !== 'email' && account.provider !== 'google') return null
  return {
    token: record.token,
    refreshToken: record.refreshToken,
    user: {
      sub: account.sub,
      email: account.email,
      name: account.name,
      provider: account.provider,
    },
  }
}
