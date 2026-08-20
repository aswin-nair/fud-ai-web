import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateRequest } from '../_lib/authenticate.js'
import { clearRefreshCookie } from '../_lib/cookies.js'
import { isDbConfigured } from '../_lib/db.js'
import { json, methodNotAllowed, serverError, unauthorized } from '../_lib/http.js'
import { InvalidSessionError } from '../_lib/jwt.js'
import {
  enforceAccountIpRateLimit,
  enforceAccountUserRateLimit,
  RateLimitExceeded,
} from '../_lib/rateLimit.js'
import { revokeAllSessions } from '../_lib/sessions.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })
  try {
    await enforceAccountIpRateLimit(req, 'logout-all')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'logout-all')
    await revokeAllSessions(session.sub)
    clearRefreshCookie(res, req)
    return json(res, 200, { ok: true })
  } catch (err) {
    clearRefreshCookie(res, req)
    if (err instanceof InvalidSessionError) return unauthorized(res)
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
