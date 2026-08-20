import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { planFreeze } from '@fud-ai/domain/freezes'
import { describe, expect, it } from 'vitest'

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/freezes.v1.json'),
  'utf8',
)) as {
  schemaVersion: number
  cases: Array<{
    id: string
    loggedDates: string[]
    freezeDates: string[]
    today: string
    available: number
    cover: string[]
    protectedStreak: number
  }>
}

describe('shared freezes.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.cases)('$id', testCase => {
    expect(planFreeze(
      testCase.loggedDates,
      testCase.freezeDates,
      testCase.today,
      testCase.available,
    )).toEqual({
      cover: testCase.cover,
      protectedStreak: testCase.protectedStreak,
    })
  })
})
