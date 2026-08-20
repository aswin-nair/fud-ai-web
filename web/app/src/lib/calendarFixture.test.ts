import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { localDateInZone, localHourInZone } from '@fud-ai/domain/calendar'
import { describe, expect, it } from 'vitest'

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/calendar.v1.json'),
  'utf8',
)) as {
  schemaVersion: number
  cases: Array<{ id: string; instant: string; timeZone: string; date: string; hour: number }>
}

describe('shared calendar.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.cases)('$id', testCase => {
    const instant = new Date(testCase.instant)
    expect(localDateInZone(instant, testCase.timeZone)).toBe(testCase.date)
    expect(localHourInZone(instant, testCase.timeZone)).toBe(testCase.hour)
  })
})
