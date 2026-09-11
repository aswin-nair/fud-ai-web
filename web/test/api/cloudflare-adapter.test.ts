import { describe, expect, it } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, InvalidJsonError, json, readJson } from '../../api/_lib/http.js'
import { CollectedResponse, runVercelHandler, toVercelRequest } from '../../cloudflare/vercelAdapter.js'

describe('Cloudflare request adapter', () => {
  it('recreates the slice of a Vercel request the API reads', async () => {
    const request = new Request('https://poiem.app/api/state?since=1&tag=a&tag=b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        Cookie: 'fud_refresh=abc',
        'CF-Connecting-IP': '203.0.113.9',
      },
      body: JSON.stringify({ hello: 'world' }),
    })
    const req = await toVercelRequest(request, { action: 'login' })

    expect(req.method).toBe('POST')
    expect(req.url).toBe('/api/state?since=1&tag=a&tag=b')
    expect(req.headers.authorization).toBe('Bearer token')
    expect(req.headers.cookie).toBe('fud_refresh=abc')
    expect(req.query).toEqual({ since: '1', tag: ['a', 'b'], action: 'login' })
    expect(req.body).toEqual({ hello: 'world' })
    expect(req.socket.remoteAddress).toBe('203.0.113.9')
  })

  it('lets route parameters win over a query string of the same name', async () => {
    const req = await toVercelRequest(new Request('https://poiem.app/api/auth?action=spoofed'), { action: 'login' })
    expect(req.query.action).toBe('login')
  })

  it('leaves malformed JSON as text so readJson still answers 400', async () => {
    const handler = async (req: VercelRequest, res: VercelResponse) => {
      try {
        await readJson(req)
      } catch (err) {
        if (err instanceof InvalidJsonError) return badRequest(res, 'Invalid JSON body')
      }
      json(res, 200, { ok: true })
    }
    const response = await runVercelHandler(handler, new Request('https://poiem.app/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    }))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' })
  })

  it('parses form bodies and gives GET requests no body', async () => {
    const form = await toVercelRequest(new Request('https://poiem.app/api/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'a=1&b=two',
    }))
    expect(form.body).toEqual({ a: '1', b: 'two' })
    expect((await toVercelRequest(new Request('https://poiem.app/api/x'))).body).toBeUndefined()
  })

  it('has no client address when Cloudflare did not supply one', async () => {
    const req = await toVercelRequest(new Request('https://poiem.app/api/x', {
      headers: { 'X-Forwarded-For': '198.51.100.1' },
    }))
    expect(req.socket.remoteAddress).toBeUndefined()
  })
})

describe('Cloudflare response adapter', () => {
  it('turns status, headers and JSON into a Fetch response', async () => {
    const res = new CollectedResponse()
    res.setHeader('X-Request-Id', 'req-1')
    res.status(201).json({ created: true })
    const response = res.toResponse()

    expect(response.status).toBe(201)
    expect(response.headers.get('x-request-id')).toBe('req-1')
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ created: true })
  })

  it('keeps the API content type when a handler already set one', () => {
    const res = new CollectedResponse()
    res.setHeader('Content-Type', 'application/json')
    res.json({})
    expect(res.toResponse().headers.get('content-type')).toBe('application/json')
  })

  it('keeps several Set-Cookie values as separate headers', () => {
    const res = new CollectedResponse()
    res.setHeader('Set-Cookie', ['a=1; Path=/', 'b=2; Path=/'])
    res.end()
    expect(res.toResponse().headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/'])
  })

  it('sends no body with 204', async () => {
    const res = new CollectedResponse()
    res.status(204).end('ignored')
    const response = res.toResponse()
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
  })

  it('answers an escaped exception with a detail-free 500', async () => {
    const response = await runVercelHandler(() => {
      throw new Error('postgres://user:secret@host/db')
    }, new Request('https://poiem.app/api/x'))
    expect(response.status).toBe(500)
    const body = await response.text()
    expect(JSON.parse(body)).toEqual({ error: 'Internal server error' })
    expect(body).not.toContain('secret')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
