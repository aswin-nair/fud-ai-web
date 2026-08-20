import type { VercelRequest, VercelResponse } from '@vercel/node'
import { authenticateRequest, issueSession } from '../_lib/authenticate.js'
import { isDbConfigured } from '../_lib/db.js'
import {
  badRequest,
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
  unauthorized,
} from '../_lib/http.js'
import { InvalidSessionError } from '../_lib/jwt.js'
import { validatePasswordInput } from '../_lib/password.js'
import {
  enforceAccountIpRateLimit,
  enforceAccountUserRateLimit,
  RateLimitExceeded,
} from '../_lib/rateLimit.js'
import { revokeAllSessions } from '../_lib/sessions.js'
import { changeEmailPassword, InvalidCredentialsError } from '../_lib/users.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    await enforceAccountIpRateLimit(req, 'change-password')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'change-password')
    const body = await readJson<{ currentPassword?: string; newPassword?: string }>(req)
    const currentPassword = body.currentPassword ?? ''
    const newPassword = body.newPassword ?? ''
    const passErr = validatePasswordInput(newPassword, true)
    if (passErr) return badRequest(res, passErr)
    const user = await changeEmailPassword(session.sub, currentPassword, newPassword)
    await revokeAllSessions(session.sub)
    const next = await issueSession(user, req, res)
    console.error(JSON.stringify({ event: 'password_changed' }))
    return json(res, 200, next)
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return unauthorized(res, 'Current password is incorrect')
    }
    if (err instanceof InvalidSessionError) return unauthorized(res)
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
