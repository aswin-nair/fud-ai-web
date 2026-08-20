import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export class InvalidJsonError extends Error {
  constructor() {
    super('Invalid JSON body')
    this.name = 'InvalidJsonError'
  }
}

function headerValue(headers: VercelRequest['headers'] | undefined, name: string): string {
  if (!headers) return ''
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0].trim()
  return ''
}

export function requestIdFrom(req?: Pick<VercelRequest, 'headers'>): string {
  const incoming = headerValue(req?.headers, 'x-request-id') || headerValue(req?.headers, 'x-vercel-id')
  if (incoming && /^[A-Za-z0-9._:-]{8,128}$/.test(incoming)) return incoming
  return randomUUID()
}

export function releaseId(): string {
  const raw = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.RELEASE_ID || 'unassigned').trim()
  return /^[A-Za-z0-9._-]{1,64}$/.test(raw) ? raw : 'unassigned'
}

export function applyIdentityHeaders(res: VercelResponse, requestId: string) {
  res.setHeader('X-Request-Id', requestId)
  res.setHeader('X-Release-Id', releaseId())
}

export function applySecurityHeaders(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
}

export function json(res: VercelResponse, status: number, body: unknown) {
  applySecurityHeaders(res)
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json(body)
}

export function methodNotAllowed(res: VercelResponse) {
  json(res, 405, { error: 'Method not allowed' })
}

export function badRequest(res: VercelResponse, message: string) {
  json(res, 400, { error: message })
}

export function unauthorized(res: VercelResponse, message = 'Unauthorized') {
  json(res, 401, { error: message })
}

export function serverError(res: VercelResponse, err: unknown) {
  // Never serialize thrown messages, stacks, request bodies, tokens, or user
  // data. Provider and database errors can contain credentials or SQL values.
  const rawName = err instanceof Error ? err.name : 'UnknownError'
  const errorName = rawName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'Error'
  console.error(JSON.stringify({ event: 'api_unhandled_error', errorName }))
  json(res, 500, { error: 'Internal server error' })
}

export async function readJson<T>(req: VercelRequest): Promise<T> {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T
    } catch {
      throw new InvalidJsonError()
    }
  }
  if (req.body && typeof req.body === 'object') return req.body as T
  return {} as T
}
