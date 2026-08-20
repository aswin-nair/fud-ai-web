import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { defaultMealType } from './meals'

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/meals.v1.json'),
  'utf8',
)) as { schemaVersion: number; cases: Array<{ hour: number; slot: string }> }

describe('shared meals.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.cases)('hour $hour -> $slot', ({ hour, slot }) => {
    expect(defaultMealType(hour)).toBe(slot)
  })
})
