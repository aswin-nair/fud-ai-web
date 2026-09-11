import { describe, expect, it, vi } from 'vitest'

// Cloudflare refuses to generate random values while a Worker's modules load,
// and the Worker then fails to start at all. Node allows it, so no other test
// can notice; this one fails if anything in the Worker's import graph does.
const loading = vi.hoisted(() => ({ active: false, calls: [] as string[] }))

vi.mock('node:crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  function watch<T extends (...args: never[]) => unknown>(name: string, fn: T): T {
    return ((...args: Parameters<T>) => {
      if (loading.active) loading.calls.push(name)
      return fn(...args)
    }) as T
  }
  const watched = {
    ...actual,
    randomBytes: watch('randomBytes', actual.randomBytes),
    randomFillSync: watch('randomFillSync', actual.randomFillSync),
    randomInt: watch('randomInt', actual.randomInt),
    randomUUID: watch('randomUUID', actual.randomUUID),
  }
  return { ...watched, default: watched }
})

describe('Cloudflare Worker startup', () => {
  it('generates no random values while its modules load', async () => {
    const webRandom = vi.spyOn(globalThis.crypto, 'getRandomValues')
    const webUuid = vi.spyOn(globalThis.crypto, 'randomUUID')
    loading.active = true
    try {
      await import('../../cloudflare/worker.js')
    } finally {
      loading.active = false
    }
    expect(loading.calls).toEqual([])
    expect(webRandom).not.toHaveBeenCalled()
    expect(webUuid).not.toHaveBeenCalled()
  })
})
