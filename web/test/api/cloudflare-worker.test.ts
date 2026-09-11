import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { APP_CONTENT_SECURITY_POLICY } from '../../shared/browserSecurityHeaders.js'

const retentionCalls = vi.hoisted(() => ({ authorization: [] as Array<string | undefined> }))

vi.mock('../../api/cron/retention.js', () => ({
  default: (req: VercelRequest, res: VercelResponse) => {
    retentionCalls.authorization.push(req.headers.authorization as string | undefined)
    res.status(200).json({ ok: true })
  },
}))

import worker, { handleRequest, matchApiRoute, runRetention, type Env } from '../../cloudflare/worker.js'

/** A stand-in for the ASSETS binding that serves a tiny build output. */
function assets(files: Record<string, string>) {
  const requested: string[] = []
  const env: Env = {
    ASSETS: {
      async fetch(request: Request) {
        const { pathname } = new URL(request.url)
        requested.push(pathname)
        const body = files[pathname]
        return body === undefined
          ? new Response('missing', { status: 404 })
          : new Response(body, { status: 200, headers: { 'Content-Type': 'text/plain' } })
      },
    },
  }
  return { env, requested }
}

beforeEach(() => {
  retentionCalls.authorization.length = 0
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Cloudflare Worker routing', () => {
  it('serves the bare domain as the Poiem welcome page', async () => {
    const { env, requested } = assets({ '/': '<html>welcome</html>' })
    const response = await handleRequest(new Request('https://poiem.app/'), env)
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<html>welcome</html>')
    expect(requested).toEqual(['/'])
  })

  it('serves the app shell for in-app routes, with the pinned browser headers', async () => {
    const { env, requested } = assets({ '/': '<html>poiem</html>' })
    const response = await handleRequest(new Request('https://poiem.app/app/login'), env)

    expect(requested).toEqual(['/login', '/'])
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<html>poiem</html>')
    expect(response.headers.get('content-security-policy')).toBe(APP_CONTENT_SECURITY_POLICY)
    expect(response.headers.get('x-frame-options')).toBe('DENY')
  })

  it('maps /app/assets onto the build output without the base path', async () => {
    const { env, requested } = assets({ '/assets/index.js': 'console.log(1)' })
    const response = await handleRequest(new Request('https://poiem.app/app/assets/index.js'), env)
    expect(requested).toEqual(['/assets/index.js'])
    expect(await response.text()).toBe('console.log(1)')
  })

  it('does not disguise a missing file as the app shell', async () => {
    const { env, requested } = assets({ '/': '<html>poiem</html>' })
    const response = await handleRequest(new Request('https://poiem.app/app/assets/gone.js'), env)
    expect(requested).toEqual(['/assets/gone.js'])
    expect(response.status).toBe(404)
  })

  it('serves root files such as the brand kit directly', async () => {
    const { env, requested } = assets({ '/brand/index.html': 'brand kit' })
    const response = await handleRequest(new Request('https://poiem.app/brand/index.html'), env)
    expect(requested).toEqual(['/brand/index.html'])
    expect(await response.text()).toBe('brand kit')
  })

  it('runs API handlers, not static files, for /api', async () => {
    const { env, requested } = assets({})
    const response = await handleRequest(new Request('https://poiem.app/api/health'), env)
    expect(requested).toEqual([])
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ live: true })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('answers unknown API paths with JSON 404', async () => {
    const { env } = assets({})
    const response = await handleRequest(new Request('https://poiem.app/api/nope'), env)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Not found' })
  })

  it('passes /api/auth/:action through as the action the dispatcher reads', () => {
    expect(matchApiRoute('/api/auth/login')?.params).toEqual({ action: 'login' })
    expect(matchApiRoute('/api/auth/forgot-password/')?.params).toEqual({ action: 'forgot-password' })
    expect(matchApiRoute('/api/auth/../state')).toBeNull()
    expect(matchApiRoute('/api/state')?.params).toEqual({})
  })
})

describe('Cloudflare cron', () => {
  it('calls the retention handler with the cron secret', async () => {
    vi.stubEnv('CRON_SECRET', 'a-long-enough-cron-secret')
    const response = await runRetention('https://poiem.app')
    expect(response.status).toBe(200)
    expect(retentionCalls.authorization).toEqual(['Bearer a-long-enough-cron-secret'])
  })

  it('sends no credential when the secret is unset', async () => {
    vi.stubEnv('CRON_SECRET', '')
    await runRetention('https://poiem.app')
    expect(retentionCalls.authorization).toEqual([undefined])
  })

  it('hands the job to waitUntil from the scheduled event', async () => {
    vi.stubEnv('CRON_SECRET', 'a-long-enough-cron-secret')
    const pending: Promise<unknown>[] = []
    await worker.scheduled({ cron: '0 4 * * *', scheduledTime: 0 }, assets({}).env, {
      waitUntil: promise => { pending.push(promise) },
    })
    await Promise.all(pending)
    expect(pending).toHaveLength(1)
    expect(retentionCalls.authorization).toEqual(['Bearer a-long-enough-cron-secret'])
  })
})
