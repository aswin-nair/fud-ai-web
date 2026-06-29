import type { VercelRequest, VercelResponse } from '@vercel/node'

export function json(res: VercelResponse, status: number, body: unknown) {
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
  console.error(err)
  json(res, 500, { error: 'Internal server error' })
}

export async function readJson<T>(req: VercelRequest): Promise<T> {
  if (typeof req.body === 'string') return JSON.parse(req.body) as T
  if (req.body && typeof req.body === 'object') return req.body as T
  return {} as T
}
