import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LEN = 64

export function hashPassword(password: string, salt?: Buffer): { hash: string; salt: string } {
  const saltBuf = salt ?? randomBytes(16)
  const derived = scryptSync(password, saltBuf, KEY_LEN)
  return {
    hash: derived.toString('base64'),
    salt: saltBuf.toString('base64'),
  }
}

export function verifyPassword(password: string, hash: string, saltB64: string): boolean {
  const salt = Buffer.from(saltB64, 'base64')
  const derived = scryptSync(password, salt, KEY_LEN)
  const expected = Buffer.from(hash, 'base64')
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

export function validateEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid email address'
  return null
}

export function validatePasswordInput(password: string, isSignUp: boolean): string | null {
  if (!password) return 'Password is required'
  if (isSignUp && password.length < 8) return 'Password must be at least 8 characters'
  return null
}
