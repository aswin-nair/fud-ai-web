import { SignJWT, jwtVerify } from 'jose'
import { isCanonicalUuid } from './identifiers.js'

export interface SessionUser {
  sub: string
  email: string
  name: string
  picture?: string
  provider: 'email' | 'google'
}

export interface SessionClaims {
  sub: string
  sessionId: string
}

export class InvalidSessionError extends Error {
  constructor() {
    super('Invalid or expired session')
    this.name = 'InvalidSessionError'
  }
}

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set (32+ characters)')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(
  user: SessionUser,
  sessionId: string,
  expiresAt?: Date,
): Promise<string> {
  if (!isCanonicalUuid(user.sub)) throw new Error('User ID must be a canonical UUID')
  if (!isCanonicalUuid(sessionId)) throw new Error('Session ID must be a canonical UUID')
  // Keep identity/profile PII out of the bearer token. The signed token needs
  // only the account subject and its revocable database-session ID.
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('fud-ai-api')
    .setAudience('fud-ai-web')
    .setSubject(user.sub)
    .setJti(sessionId)
    .setIssuedAt()
    .setExpirationTime(expiresAt ? Math.floor(expiresAt.getTime() / 1000) : '30d')
    .sign(secretKey())
}

export async function verifySession(token: string): Promise<SessionClaims> {
  // Resolve configuration outside the catch so a missing/weak server secret is
  // still a 500, while every untrusted-token failure consistently becomes 401.
  const key = secretKey()
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: 'fud-ai-api',
      audience: 'fud-ai-web',
      algorithms: ['HS256'],
    })
    if (
      !payload.sub
      || !isCanonicalUuid(payload.sub)
      || !isCanonicalUuid(payload.jti)
    ) {
      throw new InvalidSessionError()
    }
    return {
      sub: payload.sub,
      sessionId: payload.jti,
    }
  } catch (error) {
    if (error instanceof InvalidSessionError) throw error
    throw new InvalidSessionError()
  }
}

export function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const match = /^Bearer ([^\s]+)$/.exec(authHeader.trim())
  return match?.[1] ?? null
}
