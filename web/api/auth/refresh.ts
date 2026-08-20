import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clearRefreshCookie, readRefreshToken, setRefreshCookie } from '../_lib/cookies.js'
import { isDbConfigured } from '../_lib/db.js'
import { json, methodNotAllowed, serverError, unauthorized } from '../_lib/http.js'
import { signSession } from '../_lib/jwt.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'
import { RefreshNotFoundError, RefreshReplayError, rotateRefreshToken } from '../_lib/sessions.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    await enforceAuthRateLimit(req, 'refresh')
    const presented = readRefreshToken(req)
    if (!presented) {
      clearRefreshCookie(res, req)
      return unauthorized(res)
    }
    const rotated = await rotateRefreshToken(presented)
    const token = await signSession(rotated.user, rotated.id)
    setRefreshCookie(res, rotated.refreshToken, rotated.expiresAt, req)
    return json(res, 200, { token, user: rotated.user })
  } catch (err) {
    clearRefreshCookie(res, req)
    if (err instanceof RefreshReplayError || err instanceof RefreshNotFoundError) {
      return unauthorized(res)
    }
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
