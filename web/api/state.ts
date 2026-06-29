import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from './_lib/db.js'
import { bearerToken, verifySession } from './_lib/jwt.js'
import { loadUserState, saveUserState } from './_lib/state.js'
import { json, methodNotAllowed, readJson, serverError, unauthorized } from './_lib/http.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  const token = bearerToken(req.headers.authorization)
  if (!token) return unauthorized(res)

  try {
    const session = await verifySession(token)

    if (req.method === 'GET') {
      const state = await loadUserState(session.sub)
      return json(res, 200, { state })
    }

    if (req.method === 'PUT') {
      const body = await readJson<{ state?: Record<string, unknown> }>(req)
      if (!body.state || typeof body.state !== 'object') {
        return json(res, 400, { error: 'Missing state object' })
      }
      await saveUserState(session.sub, body.state)
      return json(res, 200, { ok: true })
    }

    return methodNotAllowed(res)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid token')) {
      return unauthorized(res)
    }
    serverError(res, err)
  }
}
