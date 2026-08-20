import type { VercelRequest, VercelResponse } from '@vercel/node'
import { deleteUserAccount } from './_lib/accounts.js'
import { authenticateRequest } from './_lib/authenticate.js'
import { CLOUD_WRITES_DISABLED_RESPONSE, cloudWritesEnabled } from './_lib/cloudControl.js'
import { clearRefreshCookie } from './_lib/cookies.js'
import { isDbConfigured } from './_lib/db.js'
import {
  badRequest,
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
  unauthorized,
} from './_lib/http.js'
import { InvalidSessionError } from './_lib/jwt.js'
import {
  enforceAccountIpRateLimit,
  enforceAccountUserRateLimit,
  RateLimitExceeded,
} from './_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })
  try {
    await enforceAccountIpRateLimit(req, 'delete')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'delete')
    if (!cloudWritesEnabled()) return json(res, 503, CLOUD_WRITES_DISABLED_RESPONSE)
    const body = await readJson<{ confirmation?: string }>(req)
    if (body.confirmation !== 'DELETE') {
      return badRequest(res, 'Type DELETE to confirm account deletion')
    }
    await deleteUserAccount(session.sub)
    clearRefreshCookie(res, req)
    return json(res, 200, { ok: true })
  } catch (err) {
    if (err instanceof InvalidSessionError) return unauthorized(res)
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
