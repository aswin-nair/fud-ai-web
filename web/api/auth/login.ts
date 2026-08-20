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
import { validateEmail, validatePasswordInput } from '../_lib/password.js'
import { InvalidCredentialsError, loginEmailUser } from '../_lib/users.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ email?: string; password?: string }>(req)
    const email = body.email ?? ''
    const password = body.password ?? ''

    await enforceAuthRateLimit(req, 'login', email)

    const emailErr = validateEmail(email)
    if (emailErr) return badRequest(res, emailErr)
    const passErr = validatePasswordInput(password, false)
    if (passErr) return badRequest(res, passErr)

    const user = await loginEmailUser(email, password)
    const session = await issueSession(user)
    json(res, 200, session)
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return unauthorized(res, 'Invalid email or password')
    }
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    serverError(res, err)
  }
}
