import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withApiTelemetry } from '../_lib/telemetry.js'
import { prepareAuth } from '../_lib/ensureAuthSchema.js'
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
import { EnrollmentDeniedError, assertNewAccountEnrollment } from '../_lib/enrollment.js'
import { AccountProviderConflictError, findUserByExternalSub, upsertAppleUser } from '../_lib/users.js'
import {
  enforceAuthAccountRateLimit,
  enforceAuthRateLimit,
  RateLimitExceeded,
} from '../_lib/rateLimit.js'

function decodeIdentity(token: string): { sub?: string; email?: string; iss?: string; aud?: string } | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8')) as Record<string, unknown>
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      iss: typeof payload.iss === 'string' ? payload.iss : undefined,
      aud: typeof payload.aud === 'string' ? payload.aud : undefined,
    }
  } catch {
    return null
  }
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!await prepareAuth(res)) return

  const audience = process.env.APPLE_CLIENT_ID
  if (!audience) return json(res, 503, { error: 'Apple Sign In is not configured' })

  try {
    const body = await readJson<{ identityToken?: string; email?: string; name?: string; client?: string }>(req)
    await enforceAuthRateLimit(req, 'apple')
    const transport = resolveSessionTransport(req, body)
    if (transport === 'unavailable') return json(res, 503, MOBILE_AUTH_DISABLED_RESPONSE)
    if (!body.identityToken) return badRequest(res, 'Missing Apple identity token')

    const claims = decodeIdentity(body.identityToken)
    if (!claims?.sub || claims.iss !== 'https://appleid.apple.com' || claims.aud !== audience) {
      return unauthorized(res, 'Unable to sign in')
    }
    const email = claims.email ?? body.email
    if (!email) return badRequest(res, 'Apple did not return an email')
    await enforceAuthAccountRateLimit('apple', email)

    const existing = await findUserByExternalSub(claims.sub)
    if (!existing) await assertNewAccountEnrollment(email)

    const user = await upsertAppleUser({
      appleSub: claims.sub,
      email,
      name: body.name ?? email,
    })
    const session = await issueSession(user, req, res, transport)
    json(res, 200, session)
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof EnrollmentDeniedError) return json(res, err.status, err.body)
    if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
    if (err instanceof AccountProviderConflictError) {
      return json(res, 409, { error: 'An account already exists with a different sign-in method.' })
    }
    serverError(res, err)
  }
}

export default withApiTelemetry('/api/auth/apple', handler)
