import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { eligibleMealXpAwards, levelFromXp } from '@fud-ai/domain/xp'
import { describe, expect, it } from 'vitest'

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/xp.v1.json'),
  'utf8',
)) as {
  schemaVersion: number
  levels: Array<{ xp: number; level: number }>
  awards: Array<{
    id: string
    input: {
      entryId: string
      entryName: string
      dayKey: string
      existingSameDayCount: number
      recentFoodNames: string[]
      usedKeys: string[]
    }
    keys: string[]
  }>
}

describe('shared xp.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.levels)('$xp xp is level $level', ({ xp, level }) => {
    expect(levelFromXp(xp)).toBe(level)
  })

  it.each(fixture.awards)('$id', ({ input, keys }) => {
    expect(eligibleMealXpAwards({
      ...input,
      usedKeys: new Set(input.usedKeys),
    }).map(award => award.key)).toEqual(keys)
  })
})
