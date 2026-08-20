import { describe, expect, it } from 'vitest'

import {
  runStagingLifecycle,
  stagingLifecyclePlan,
} from '../../scripts/staging-lifecycle-lib.mjs'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('staging cloud lifecycle gate', () => {
  it('does not certify the cloud path when staging is unset', () => {
    const plan = stagingLifecyclePlan({})
    expect(plan).toEqual({
      run: false,
      certified: false,
      reason: 'STAGING_BASE_URL is not set; cloud lifecycle is not certified',
    })
  })

  it('refuses a non-https remote origin', () => {
    const plan = stagingLifecyclePlan({ STAGING_BASE_URL: 'http://staging.example' })
    expect(plan.run).toBe(false)
    expect(plan.certified).toBe(false)
  })

  it('accepts an https staging origin without claiming a pass', () => {
    const plan = stagingLifecyclePlan({ STAGING_BASE_URL: 'https://staging.example/' })
    expect(plan).toEqual({
      run: true,
      certified: false,
      baseUrl: 'https://staging.example',
    })
  })

  it('deletes the temp account when a later step fails', async () => {
    const calls: { url: string; method: string }[] = []
    const fetchImpl: typeof fetch = async (url, init) => {
      const path = String(url)
      const method = init?.method ?? 'GET'
      calls.push({ url: path, method })
      if (path.endsWith('/api/health')) return jsonResponse({ live: true })
      if (path.endsWith('/api/ready')) return jsonResponse({ ready: true })
      if (path.endsWith('/api/auth/register')) {
        return jsonResponse({ token: 'register-token', user: { sub: 'user' } }, 201)
      }
      if (path.endsWith('/api/auth/login')) {
        return jsonResponse({ token: 'login-token', user: { sub: 'user' } })
      }
      if (path.endsWith('/api/state') && method === 'GET') {
        return jsonResponse({ state: null, version: 0 })
      }
      if (path.endsWith('/api/state') && method === 'PUT') {
        return jsonResponse({ error: 'write failed' }, 500)
      }
      if (path.endsWith('/api/account') && method === 'DELETE') {
        return jsonResponse({ ok: true })
      }
      return jsonResponse({ error: 'unexpected' }, 500)
    }

    await expect(runStagingLifecycle('https://staging.example', fetchImpl)).rejects.toThrow('First write failed')
    expect(calls.some(call => call.url.endsWith('/api/account') && call.method === 'DELETE')).toBe(true)
  })
})
