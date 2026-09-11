import type { VercelRequest, VercelResponse } from '@vercel/node'
import { serverError } from '../api/_lib/http.js'

/*
 * Runs the existing Vercel-style API handlers inside a Cloudflare Worker.
 *
 * The handlers only touch a small slice of Vercel's request and response
 * objects — method, url, headers, query, body and socket on the way in;
 * setHeader, status and json on the way out — so this adapter recreates exactly
 * that slice instead of porting 25 handlers to a new signature. The handlers,
 * and the API tests that cover them, stay unchanged.
 */

export type VercelHandler = (req: VercelRequest, res: VercelResponse) => unknown

type HeaderValue = string | number | readonly string[]

export interface AdaptedRequest {
  method: string
  url: string
  headers: Record<string, string | string[]>
  query: Record<string, string | string[]>
  body: unknown
  socket: { remoteAddress?: string }
}

const BODYLESS_METHODS = new Set(['GET', 'HEAD'])

async function readBody(request: Request): Promise<unknown> {
  const text = await request.text()
  if (!text) return undefined
  const type = (request.headers.get('content-type') ?? '').toLowerCase()
  if (type.includes('application/json')) {
    // Vercel rejects malformed JSON; handing readJson() the raw string makes it
    // raise InvalidJsonError, so the handler still answers 400.
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }
  if (type.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(text))
  }
  return text
}

export async function toVercelRequest(
  request: Request,
  params: Record<string, string> = {},
): Promise<AdaptedRequest> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  const headers: Record<string, string | string[]> = {}
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  const query: Record<string, string | string[]> = {}
  for (const [key, value] of url.searchParams) {
    const existing = query[key]
    if (existing === undefined) query[key] = value
    else query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
  }
  Object.assign(query, params)

  return {
    method,
    url: `${url.pathname}${url.search}`,
    headers,
    query,
    body: BODYLESS_METHODS.has(method) ? undefined : await readBody(request),
    // Cloudflare sets CF-Connecting-IP at its edge and clients cannot supply
    // it, so it plays the role of the socket address the rate limiter trusts.
    socket: { remoteAddress: request.headers.get('cf-connecting-ip') ?? undefined },
  }
}

/** Collects what a handler writes, then turns it into a Fetch Response. */
export class CollectedResponse {
  statusCode = 200
  finished = false
  private readonly headerMap = new Map<string, { name: string; value: HeaderValue }>()
  private payload: BodyInit | null = null

  setHeader(name: string, value: HeaderValue): this {
    this.headerMap.set(name.toLowerCase(), { name, value })
    return this
  }

  getHeader(name: string): HeaderValue | undefined {
    return this.headerMap.get(name.toLowerCase())?.value
  }

  hasHeader(name: string): boolean {
    return this.headerMap.has(name.toLowerCase())
  }

  removeHeader(name: string): void {
    this.headerMap.delete(name.toLowerCase())
  }

  status(code: number): this {
    this.statusCode = code
    return this
  }

  json(body: unknown): this {
    if (!this.hasHeader('content-type')) this.setHeader('Content-Type', 'application/json; charset=utf-8')
    return this.end(JSON.stringify(body))
  }

  send(body: unknown): this {
    if (body !== null && typeof body === 'object' && !(body instanceof Uint8Array) && !(body instanceof ArrayBuffer)) {
      return this.json(body)
    }
    return this.end(body === undefined || body === null ? null : body as string | Uint8Array | ArrayBuffer)
  }

  end(chunk?: string | Uint8Array | ArrayBuffer | null): this {
    // Workers accept typed arrays as bodies; the cast only bridges TypeScript's DOM typing.
    if (chunk !== undefined) this.payload = chunk as BodyInit | null
    this.finished = true
    return this
  }

  toResponse(): Response {
    const headers = new Headers()
    for (const { name, value } of this.headerMap.values()) {
      if (Array.isArray(value)) {
        // Several Set-Cookie values must stay separate headers, never joined.
        for (const item of value) headers.append(name, String(item))
      } else {
        headers.set(name, String(value))
      }
    }
    const bodyless = this.statusCode === 204 || this.statusCode === 304
    return new Response(bodyless ? null : this.payload, { status: this.statusCode, headers })
  }
}

export async function runVercelHandler(
  handler: VercelHandler,
  request: Request,
  params: Record<string, string> = {},
): Promise<Response> {
  const req = await toVercelRequest(request, params)
  const res = new CollectedResponse()
  try {
    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse)
  } catch (err) {
    // Handlers already redact their own failures; this only catches one that
    // escapes, with the same no-details 500 the API uses everywhere else.
    const fresh = new CollectedResponse()
    serverError(fresh as unknown as VercelResponse, err)
    return fresh.toResponse()
  }
  return res.toResponse()
}
