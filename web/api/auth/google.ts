import { OAuth2Client } from 'google-auth-library'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isDbConfigured } from '../_lib/db'
import { badRequest, json, methodNotAllowed, readJson, serverError } from '../_lib/http'
import { signSession } from '../_lib/jwt'
import { upsertGoogleUser } from '../_lib/users'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)
  if (!isDbConfigured()) return json(res, 503, { error: 'Database not configured' })

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID
  if (!clientId) return json(res, 503, { error: 'Google OAuth not configured' })

  try {
    const body = await readJson<{ credential?: string }>(req)
    if (!body.credential) return badRequest(res, 'Missing Google credential')

    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) return badRequest(res, 'Invalid Google token')

    const user = await upsertGoogleUser({
      googleSub: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture,
    })
    const token = await signSession(user)
    json(res, 200, { token, user })
  } catch (err) {
    serverError(res, err)
  }
}
