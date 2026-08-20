import type { VercelRequest } from '@vercel/node'
import {
  bearerToken,
  InvalidSessionError,
  signSession,
  verifySession,
  type SessionClaims,
  type SessionUser,
} from './jwt.js'
import { createSession, isSessionActive } from './sessions.js'

export async function issueSession(user: SessionUser): Promise<{ token: string; user: SessionUser }> {
  const session = await createSession(user.sub)
  const token = await signSession(user, session.id, session.expiresAt)
  return { token, user }
}

export async function authenticateRequest(req: VercelRequest): Promise<SessionClaims> {
  const token = bearerToken(req.headers.authorization)
  if (!token) throw new InvalidSessionError()
  const session = await verifySession(token)
  if (!await isSessionActive(session.sub, session.sessionId)) {
    throw new InvalidSessionError()
  }
  return session
}
