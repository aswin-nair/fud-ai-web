import type { AuthUser } from './auth'
import type { AppState } from '../types'
import { apiBaseUrl, isCloudBackend } from './dataBackend'
import { stateWithoutPrivateSecrets } from './storage'

const TOKEN_KEY = 'fud-ai-auth-token'
const API_TIMEOUT_MS = 12_000

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function saveAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function loadAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  sessionToken?: string,
): Promise<T> {
  const base = apiBaseUrl()
  const url = `${base}${path}`
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = sessionToken === undefined ? loadAuthToken() : sessionToken
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  let res: Response
  let data: ({ error?: string } & T)
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal })
    try {
      data = await res.json() as { error?: string } & T
    } catch (error) {
      // Invalid or empty JSON is tolerated so the status-based fallback below
      // remains useful, but an aborted body read must still report a timeout.
      if (controller.signal.aborted) throw error
      data = {} as { error?: string } & T
    }
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError('Request timed out. Check your connection and try again.', 0)
    }
    throw new ApiError('Could not reach the server. Your saved changes will retry automatically.', 0)
  } finally {
    globalThis.clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status)
  }
  return data as T
}

export async function apiRegister(name: string, email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function apiLogin(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function apiGoogleAuth(credential: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export async function apiLoadState(
  sessionToken: string,
): Promise<{ state: unknown | null; version: number }> {
  if (!isCloudBackend()) return { state: null, version: 0 }
  const result = await apiFetch<{ state: unknown | null; version: number }>(
    '/api/state',
    {},
    sessionToken,
  )
  if (!Number.isSafeInteger(result.version) || result.version < 0) {
    throw new ApiError('The account state version is invalid.', 0)
  }
  return result
}

export async function apiLogout(sessionToken: string): Promise<void> {
  await apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }, sessionToken)
}

export async function apiLogoutAll(sessionToken: string): Promise<void> {
  await apiFetch<{ ok: true }>('/api/auth/logout-all', { method: 'POST' }, sessionToken)
}

export async function apiDeleteAccount(sessionToken: string): Promise<void> {
  await apiFetch<{ ok: true }>('/api/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirmation: 'DELETE' }),
  }, sessionToken)
}

export async function apiSaveState(
  state: AppState,
  baseVersion: number,
  sessionToken: string,
  mutationId: string,
): Promise<number> {
  if (!isCloudBackend()) return baseVersion
  const result = await apiFetch<{ version: number }>('/api/state', {
    method: 'PUT',
    body: JSON.stringify({
      state: stateWithoutPrivateSecrets(state),
      baseVersion,
      mutationId,
    }),
  }, sessionToken)
  if (!Number.isSafeInteger(result.version) || result.version <= baseVersion) {
    throw new ApiError('The saved account version is invalid.', 0)
  }
  return result.version
}

export async function apiHealth(): Promise<{ live: boolean; requestId: string; release: string }> {
  return apiFetch('/api/health')
}

export async function apiReady(): Promise<{ ready: boolean; requestId: string; release: string }> {
  return apiFetch('/api/ready')
}
