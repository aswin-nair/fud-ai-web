import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CLOUD_WRITES_DISABLED_RESPONSE, cloudWritesEnabled } from './_lib/cloudControl.js'
import { isDbConfigured } from './_lib/db.js'
import { authenticateRequest } from './_lib/authenticate.js'
import { InvalidSessionError } from './_lib/jwt.js'
import {
  loadUserState,
  saveUserState,
  StateMutationConflict,
  StateVersionConflict,
} from './_lib/state.js'
import {
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
  unauthorized,
} from './_lib/http.js'
import {
  enforceStateIpRateLimit,
  enforceStateUserRateLimit,
  RateLimitExceeded,
} from './_lib/rateLimit.js'
import { isCanonicalUuid } from './_lib/identifiers.js'
import { validateAppState } from '../shared/appStateContract.js'

const MAX_STATE_BYTES = 2_000_000
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  try {
    await enforceStateIpRateLimit(req)
    const session = await authenticateRequest(req)
    await enforceStateUserRateLimit(session.sub)

    if (req.method === 'GET') {
      const loaded = await loadUserState(session.sub)
      return json(res, 200, loaded ?? { state: null, version: 0 })
    }

    if (req.method === 'PUT') {
      if (!cloudWritesEnabled()) return json(res, 503, CLOUD_WRITES_DISABLED_RESPONSE)
      const body = await readJson<{
        state?: Record<string, unknown>
        baseVersion?: number
        mutationId?: string
      }>(req)
      if (!body.state || typeof body.state !== 'object') {
        return json(res, 400, { error: 'Missing state object' })
      }
      if (!Number.isSafeInteger(body.baseVersion) || (body.baseVersion ?? -1) < 0) {
        return json(res, 400, { error: 'Missing or invalid baseVersion' })
      }
      if (!isCanonicalUuid(body.mutationId)) {
        return json(res, 400, { error: 'Missing or invalid mutationId' })
      }
      const validation = validateAppState(body.state, new Date(), { allowApiKey: false })
      if (!validation.ok) {
        return json(res, 400, { error: `Invalid state: ${validation.error}` })
      }
      if (Buffer.byteLength(JSON.stringify(body.state), 'utf8') > MAX_STATE_BYTES) {
        return json(res, 413, { error: 'State payload is too large' })
      }
      const saved = await saveUserState(
        session.sub,
        body.state,
        body.baseVersion as number,
        body.mutationId,
      )
      return json(res, 200, { ok: true, version: saved.version })
    }

    return methodNotAllowed(res)
  } catch (err) {
    if (err instanceof StateVersionConflict) {
      return json(res, 409, { error: 'State changed elsewhere. Reload before saving.' })
    }
    if (err instanceof StateMutationConflict) {
      return json(res, 409, { error: 'Mutation ID was already used for a different write.' })
    }
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    if (err instanceof InvalidJsonError) {
      return json(res, 400, { error: 'Invalid JSON body' })
    }
    if (err instanceof InvalidSessionError) {
      return unauthorized(res)
    }
    serverError(res, err)
  }
}
