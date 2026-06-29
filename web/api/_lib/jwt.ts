import { SignJWT, jwtVerify } from 'jose'

export interface SessionClaims {
  sub: string
  email: string
  name: string
  picture?: string
  provider: 'email' | 'google'
}

function secretKey() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set (32+ characters)')
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(user: SessionClaims): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    picture: user.picture,
    provider: user.provider,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey())
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secretKey())
  if (!payload.sub || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
    throw new Error('Invalid token payload')
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    provider: payload.provider === 'google' ? 'google' : 'email',
  }
}

export function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim() || null
}
