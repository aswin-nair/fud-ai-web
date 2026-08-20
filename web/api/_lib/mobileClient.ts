import type { VercelRequest } from '@vercel/node'
import { mobileAuthEnabled } from './cloudControl.js'
import { readRefreshToken } from './cookies.js'

export type SessionTransport = 'cookie' | 'mobile'

export type SessionTransportDecision = SessionTransport | 'unavailable'

function headerValue(headers: VercelRequest['headers'] | undefined, name: string): string {
  if (!headers) return ''
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim()
  return ''
}

export function wantsMobileClient(body: unknown): boolean {
  return Boolean(body) && typeof body === 'object' && !Array.isArray(body)
    && (body as { client?: unknown }).client === 'mobile'
}

/**
 * Browser navigations send Origin or an http(s) Referer. Native mobile
 * clients typically send neither. A page on the web origin must never receive
 * a refresh token in JSON.
 */
export function hasBrowserOrigin(req: Pick<VercelRequest, 'headers'>): boolean {
  if (headerValue(req.headers, 'origin')) return true
  return /^https?:\/\//i.test(headerValue(req.headers, 'referer'))
}

export function resolveSessionTransport(
  req: Pick<VercelRequest, 'headers'>,
  body: unknown,
): SessionTransportDecision {
  if (!wantsMobileClient(body)) return 'cookie'
  if (!mobileAuthEnabled()) return 'unavailable'
  if (hasBrowserOrigin(req)) return 'cookie'
  return 'mobile'
}

export function readPresentedRefreshToken(
  req: Pick<VercelRequest, 'headers'>,
  body: unknown,
): string | null {
  const cookie = readRefreshToken(req)
  if (cookie) return cookie
  if (resolveSessionTransport(req, body) !== 'mobile') return null
  const token = Boolean(body) && typeof body === 'object' && !Array.isArray(body)
    ? (body as { refreshToken?: unknown }).refreshToken
    : null
  return typeof token === 'string' && token.length >= 16 && token.length <= 256 ? token : null
}
