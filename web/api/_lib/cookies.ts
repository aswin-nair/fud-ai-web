import type { VercelRequest, VercelResponse } from '@vercel/node'

export const REFRESH_COOKIE = 'fud_refresh'

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function cookieSecure(req?: Pick<VercelRequest, 'headers'>): boolean {
  if (process.env.COOKIE_SECURE === '1') return true
  if (process.env.COOKIE_SECURE === '0') return false
  const proto = firstHeader(req?.headers['x-forwarded-proto'])
  return proto === 'https' || process.env.VERCEL === '1'
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 1) continue
    const name = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (name) cookies[name] = decodeURIComponent(value)
  }
  return cookies
}

export function readRefreshToken(req: Pick<VercelRequest, 'headers'>): string | null {
  const token = parseCookies(firstHeader(req.headers.cookie))[REFRESH_COOKIE]
  return token && token.length >= 16 && token.length <= 256 ? token : null
}

function cookieParts(value: string, maxAge: number, req?: Pick<VercelRequest, 'headers'>): string {
  const parts = [
    `${REFRESH_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ]
  if (cookieSecure(req)) parts.push('Secure')
  return parts.join('; ')
}

export function setRefreshCookie(
  res: VercelResponse,
  token: string,
  expiresAt: Date,
  req?: Pick<VercelRequest, 'headers'>,
) {
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  res.setHeader('Set-Cookie', cookieParts(token, maxAge, req))
}

export function clearRefreshCookie(
  res: VercelResponse,
  req?: Pick<VercelRequest, 'headers'>,
) {
  res.setHeader('Set-Cookie', cookieParts('', 0, req))
}
