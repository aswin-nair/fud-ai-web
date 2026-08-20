import { OAuth2Client } from 'google-auth-library'
import type { VercelRequest, VercelResponse } from '@vercel/node'
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
import { issueSession } from '../_lib/authenticate.js'
import { AccountProviderConflictError, upsertGoogleUser } from '../_lib/users.js'
import {
  enforceAuthAccountRateLimit,
  enforceAuthRateLimit,
  RateLimitExceeded,
} from '../_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID
  if (!clientId) return json(res, 503, { error: 'Google OAuth not configured' })

  try {
    const body = await readJson<{ credential?: string }>(req)
    await enforceAuthRateLimit(req, 'google')
    if (!body.credential) return badRequest(res, 'Missing Google credential')

    const client = new OAuth2Client(clientId)
    let ticket
    try {
      ticket = await client.verifyIdToken({
        idToken: body.credential,
        audience: clientId,
      })
    } catch {
      return unauthorized(res, 'Unable to sign in')
    }
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return badRequest(res, 'Invalid Google token')
    }
    await enforceAuthAccountRateLimit('google', payload.email)

    const user = await upsertGoogleUser({
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture,
    })
    const session = await issueSession(user, req, res)
    json(res, 200, session)
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    if (err instanceof AccountProviderConflictError) {
      return json(res, 409, { error: 'An account already exists with a different sign-in method.' })
    }
    serverError(res, err)
  }
}
