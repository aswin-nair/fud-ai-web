export type AuthProvider = 'google' | 'email'

export interface AuthUser {
  sub: string
  email: string
  name: string
  picture?: string
  provider?: AuthProvider
}

export interface GoogleJwtPayload {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified?: boolean
}

const SESSION_KEY = 'fud-ai-auth-session'

export function loadAuthSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    if (!user.sub || !user.email) return null
    return user
  } catch {
    return null
  }
}

export function saveAuthSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()

export function isGoogleAuthConfigured(): boolean {
  return googleClientId.length > 0
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
