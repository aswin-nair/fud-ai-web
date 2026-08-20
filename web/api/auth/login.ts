import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withApiTelemetry } from '../_lib/telemetry.js'
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
import { MOBILE_AUTH_DISABLED_RESPONSE } from '../_lib/cloudControl.js'
import { resolveSessionTransport } from '../_lib/mobileClient.js'
import { validateEmail, validatePasswordInput } from '../_lib/password.js'
import { InvalidCredentialsError, loginEmailUser } from '../_lib/users.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    const body = await readJson<{ email?: string; password?: string; client?: string }>(req)
    const email = body.email ?? ''
    const password = body.password ?? ''

    await enforceAuthRateLimit(req, 'login', email)
    const transport = resolveSessionTransport(req, body)
    if (transport === 'unavailable') return json(res, 503, MOBILE_AUTH_DISABLED_RESPONSE)

    const emailErr = validateEmail(email)
    if (emailErr) return badRequest(res, emailErr)
    const passErr = validatePasswordInput(password, false)
    if (passErr) return badRequest(res, passErr)

    const user = await loginEmailUser(email, password)
    const session = await issueSession(user, req, res, transport)
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
export default withApiTelemetry('/api/auth/login', handler)
