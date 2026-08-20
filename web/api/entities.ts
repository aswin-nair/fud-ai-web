import type { VercelRequest, VercelResponse } from '@vercel/node'
import { validateMutationBatch, type EntityMutation } from '@fud-ai/contracts'
import { authenticateRequest } from './_lib/authenticate.js'
import {
  ENTITY_PROJECTION_DISABLED_RESPONSE,
  entityProjectionEnabled,
} from './_lib/cloudControl.js'
import { isDbConfigured } from './_lib/db.js'
import {
  EntityMutationConflict,
  EntityVersionConflict,
  applyEntityMutation,
} from './_lib/entities.js'
import {
  InvalidJsonError,
  json,
  methodNotAllowed,
  readJson,
  serverError,
  unauthorized,
} from './_lib/http.js'
import { InvalidSessionError } from './_lib/jwt.js'
import {
  enforceAccountIpRateLimit,
  enforceAccountUserRateLimit,
  RateLimitExceeded,
} from './_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })
  if (!entityProjectionEnabled()) return json(res, 503, ENTITY_PROJECTION_DISABLED_RESPONSE)

  try {
    await enforceAccountIpRateLimit(req, 'entities')
    const session = await authenticateRequest(req)
    await enforceAccountUserRateLimit(session.sub, 'entities')
    const body = await readJson<{ mutations?: EntityMutation[] }>(req)
    const valid = validateMutationBatch(body.mutations)
    if (!valid.ok) return json(res, 400, { error: valid.error })
    const mutations = body.mutations as EntityMutation[]
    const acks = []
    for (const mutation of mutations) {
      try {
        acks.push(await applyEntityMutation(session.sub, mutation))
      } catch (err) {
        if (err instanceof EntityMutationConflict || err instanceof EntityVersionConflict) {
          return json(res, 409, {
            error: 'This mutation could not be applied.',
            mutationId: mutation.mutationId,
            acks,
          })
        }
        throw err
      }
    }
    return json(res, 200, { acks })
  } catch (err) {
    if (err instanceof InvalidSessionError) return unauthorized(res)
    if (err instanceof InvalidJsonError) return json(res, 400, { error: 'Invalid JSON body' })
    if (err instanceof RateLimitExceeded) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds))
      return json(res, 429, { error: 'Too many requests. Try again later.' })
    }
    return serverError(res, err)
  }
}
