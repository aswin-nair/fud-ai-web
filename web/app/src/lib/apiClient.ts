import type { AuthUser } from './auth'
import type { AppState } from '../types'
import { apiBaseUrl, isCloudBackend } from './dataBackend'

const TOKEN_KEY = 'fud-ai-auth-token'

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

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = apiBaseUrl()
  const url = `${base}${path}`
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = loadAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers })
  const data = await res.json().catch(() => ({})) as { error?: string } & T

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

export async function apiLoadState(): Promise<AppState | null> {
  if (!isCloudBackend()) return null
  const { state } = await apiFetch<{ state: Partial<AppState> }>('/api/state')
  return state as AppState
}

export async function apiSaveState(state: AppState): Promise<void> {
  if (!isCloudBackend()) return
  await apiFetch('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ state }),
  })
}

export async function apiHealth(): Promise<{ ok: boolean; database: boolean }> {
  return apiFetch('/api/health')
}
