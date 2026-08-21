import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withApiTelemetry } from '../_lib/telemetry.js'
import { prepareAuth } from '../_lib/ensureAuthSchema.js'
import {
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
} from '../_lib/http.js'
import {
  isMailerConfigured,
  passwordResetUrl,
  sendPasswordResetEmail,
} from '../_lib/mailer.js'
import { validateEmail } from '../_lib/password.js'
import { createPasswordResetToken } from '../_lib/passwordReset.js'
import { enforceAuthRateLimit, RateLimitExceeded } from '../_lib/rateLimit.js'
import { findUserByEmail } from '../_lib/users.js'

const ACCEPTED = { ok: true }

function auditResetRequest() {
  console.error(JSON.stringify({ event: 'password_reset_requested' }))
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!await prepareAuth(res)) return

  try {
    const body = await readJson<{ email?: string }>(req)
    const email = body.email ?? ''
    await enforceAuthRateLimit(req, 'forgot', email)
    if (validateEmail(email)) {
      auditResetRequest()
      return json(res, 200, ACCEPTED)
    }

    const user = await findUserByEmail(email)
    if (isMailerConfigured() && user?.provider === 'email') {
      const created = await createPasswordResetToken(user.id)
      const resetUrl = created ? passwordResetUrl(created.token) : null
      if (created && resetUrl) {
        try {
          await sendPasswordResetEmail({ to: user.email, resetUrl })
        } catch (error) {
          const rawName = error instanceof Error ? error.name : 'UnknownError'
          console.error(JSON.stringify({
            event: 'password_reset_mail_failed',
            errorName: rawName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'Error',
          }))
        }
      }
    }

    auditResetRequest()
    return json(res, 200, ACCEPTED)
  } catch (err) {
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) {
      auditResetRequest()
      return json(res, 200, ACCEPTED)
    }
    return serverError(res, err)
  }
}
export default withApiTelemetry('/api/auth/forgot-password', handler)
