import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db.js'
import {
  badRequest,
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
} from '../_lib/http.js'
import { issueSession } from '../_lib/authenticate.js'
import { validateEmail, validatePasswordInput } from '../_lib/password.js'
import { DuplicateAccountError, registerEmailUser } from '../_lib/users.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ name?: string; email?: string; password?: string }>(req)
    const name = body.name?.trim() ?? ''
    const email = body.email ?? ''
    const password = body.password ?? ''

    await enforceAuthRateLimit(req, 'register', email)

    if (!name) return badRequest(res, 'Name is required')
    if (name.length > 100) return badRequest(res, 'Name must be 100 characters or fewer')
    const emailErr = validateEmail(email)
    if (emailErr) return badRequest(res, emailErr)
    const passErr = validatePasswordInput(password, true)
    if (passErr) return badRequest(res, passErr)

    const user = await registerEmailUser(name, email, password)
    const session = await issueSession(user)
    json(res, 201, session)
  } catch (err) {
    if (err instanceof DuplicateAccountError) {
      return badRequest(res, 'Unable to create account with those details')
    }
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    serverError(res, err)
  }
}
