import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

interface Rewrite {
  source: string
  destination: string
}

describe('Vercel public asset rewrites', () => {
  it('serves the production Momo image before the SPA catch-all', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
    ) as { rewrites: Rewrite[] }
    const mascotRewrite = config.rewrites.findIndex(
      rewrite => rewrite.source === '/app/mascots/(.*)'
        && rewrite.destination === '/mascots/$1',
    )
    const spaCatchAll = config.rewrites.findIndex(
      rewrite => rewrite.source === '/app/(.*)'
        && rewrite.destination === '/index.html',
    )

    expect(mascotRewrite).toBeGreaterThanOrEqual(0)
    expect(spaCatchAll).toBeGreaterThan(mascotRewrite)
  })
})
