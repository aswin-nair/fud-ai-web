import type { AuthUser } from './auth'

const USERS_KEY = 'fud-ai-local-users'

interface StoredUser {
  sub: string
  email: string
  name: string
  passwordHash: string
  salt: string
  createdAt: string
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) as Record<string, StoredUser> : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function emailToSub(email: string): string {
  return `email:${normalizeEmail(email)}`
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 120_000, hash: 'SHA-256' },
    key,
    256,
  )
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

function saltToB64(salt: Uint8Array): string {
  return btoa(String.fromCharCode(...salt))
}

function b64ToSalt(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email)
  if (!normalized) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid email address'
  return null
}

export function validatePassword(password: string, isSignUp: boolean): string | null {
  if (!password) return 'Password is required'
  if (isSignUp && password.length < 8) return 'Password must be at least 8 characters'
  return null
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const trimmedName = name.trim()
  const normalized = normalizeEmail(email)

  if (!trimmedName) throw new Error('Name is required')
  const emailErr = validateEmail(email)
  if (emailErr) throw new Error(emailErr)
  const passErr = validatePassword(password, true)
  if (passErr) throw new Error(passErr)

  const users = loadUsers()
  if (users[normalized]) throw new Error('An account with this email already exists')

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const passwordHash = await hashPassword(password, salt)

  const user: StoredUser = {
    sub: emailToSub(normalized),
    email: normalized,
    name: trimmedName,
    passwordHash,
    salt: saltToB64(salt),
    createdAt: new Date().toISOString(),
  }

  users[normalized] = user
  saveUsers(users)

  return {
    sub: user.sub,
    email: user.email,
    name: user.name,
    provider: 'email',
  }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const normalized = normalizeEmail(email)
  const emailErr = validateEmail(email)
  if (emailErr) throw new Error(emailErr)
  const passErr = validatePassword(password, false)
  if (passErr) throw new Error(passErr)

  const users = loadUsers()
  const stored = users[normalized]
  if (!stored) throw new Error('No account found with this email')

  const hash = await hashPassword(password, b64ToSalt(stored.salt))
  if (hash !== stored.passwordHash) throw new Error('Incorrect password')

  return {
    sub: stored.sub,
    email: stored.email,
    name: stored.name,
    provider: 'email',
  }
}
