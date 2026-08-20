import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { PRODUCT_SURFACES, availabilityClaimHits } from './copy-policy-lib.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('canary copy that advertises managed AI is detected', () => {
  const hits = availabilityClaimHits(
    'Bring your own key or use optional Fud AI Premium for hosted Gemini + Deepgram access.',
  )
  assert.ok(hits.includes('optional Fud AI Premium'))
})

test('unavailable and refund wording is not treated as an availability claim', () => {
  const hits = availabilityClaimHits(
    'Managed hosted AI is not available. If you previously subscribed, manage or cancel it in Settings → Apple Account → Subscriptions. Use Bring Your Own Key.',
  )
  assert.deepEqual(hits, [])
})

test('product, store, and legal surfaces do not advertise managed AI as available', () => {
  for (const relative of PRODUCT_SURFACES) {
    const text = readFileSync(join(root, relative), 'utf8')
    assert.deepEqual(availabilityClaimHits(text), [], relative)
  }
})
