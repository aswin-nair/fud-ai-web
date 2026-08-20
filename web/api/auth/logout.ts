import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withApiTelemetry } from '../_lib/telemetry.js'
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
import { revokeSession } from '../_lib/sessions.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })
  try {
    await enforceAccountIpRateLimit(req, 'logout')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'logout')
    await revokeSession(session.sub, session.sessionId)
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
export default withApiTelemetry('/api/auth/logout', handler)
