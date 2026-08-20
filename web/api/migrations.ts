import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateMigrationAttempt, type MigrationAttempt } from '@fud-ai/contracts'
import { authenticateRequest } from './_lib/authenticate.js'
import {
  LOCAL_MIGRATION_DISABLED_RESPONSE,
  localMigrationEnabled,
} from './_lib/cloudControl.js'
import { isDbConfigured } from './_lib/db.js'
import {
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
  unauthorized,
} from './_lib/http.js'
import { InvalidSessionError } from './_lib/jwt.js'
import { MigrationConflictError, recordMigrationAttempt } from './_lib/migrations.js'
import {
  enforceAccountIpRateLimit,
  enforceAccountUserRateLimit,
  RateLimitExceeded,
} from './_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })
  if (!localMigrationEnabled()) return json(res, 503, LOCAL_MIGRATION_DISABLED_RESPONSE)

  try {
    await enforceAccountIpRateLimit(req, 'migration')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'migration')
    const body = await readJson<MigrationAttempt>(req)
    const valid = validateMigrationAttempt(body)
    if (!valid.ok) return json(res, 400, { error: valid.error })
    const recorded = await recordMigrationAttempt(session.sub, body)
    return json(res, 200, {
      ok: true,
      migrationId: recorded.migrationId,
      stage: recorded.stage,
      counts: recorded.counts,
    })
  } catch (err) {
    if (err instanceof InvalidSessionError) return unauthorized(res)
    if (err instanceof MigrationConflictError) {
      return json(res, 409, { error: 'This migration cannot be advanced.' })
    }
    if (err instanceof InvalidJsonError) return json(res, 400, { error: 'Invalid JSON body' })
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
