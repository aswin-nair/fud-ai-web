import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db.js'
import {
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
} from '../_lib/http.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'
import { consumePasswordResetToken } from '../_lib/passwordReset.js'

const INVALID = { error: 'This reset link is invalid or has expired.' }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ token?: string; password?: string }>(req)
    await enforceAuthRateLimit(req, 'reset')
    const token = typeof body.token === 'string' ? body.token : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const changed = await consumePasswordResetToken(token, password)
    if (!changed) return json(res, 400, INVALID)
    console.error(JSON.stringify({ event: 'password_reset_completed' }))
    return json(res, 200, { ok: true })
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) return json(res, 400, INVALID)
    return serverError(res, err)
  }
}
