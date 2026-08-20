import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  bearerToken,
  InvalidSessionError,
  signSession,
  verifySession,
  type SessionClaims,
  type SessionUser,
} from './jwt.js'
import { createSession, isSessionActive } from './sessions.js'
import { setRefreshCookie } from './cookies.js'
import type { SessionTransport } from './mobileClient.js'

export interface IssuedSession {
  token: string
  user: SessionUser
  refreshToken?: string
}

export async function issueSession(
  user: SessionUser,
  req: VercelRequest,
  res: VercelResponse,
  transport: SessionTransport = 'cookie',
): Promise<IssuedSession> {
  const session = await createSession(user.sub)
  const token = await signSession(user, session.id)
  if (transport === 'mobile') {
    return { token, user, refreshToken: session.refreshToken }
  }
  setRefreshCookie(res, session.refreshToken, session.expiresAt, req)
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
