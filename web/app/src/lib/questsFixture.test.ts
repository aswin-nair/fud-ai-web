import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { QUEST_TYPES } from '@fud-ai/domain/quests'
import { describe, expect, it } from 'vitest'

import { questForDate } from './quests'

const fixture = JSON.parse(readFileSync(
  resolve(process.cwd(), '../../packages/domain/fixtures/quests.v1.json'),
  'utf8',
)) as { schemaVersion: number; dates: string[] }

describe('shared quests.v1 web adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1)
  })

  it.each(fixture.dates)('stays stable for %s', date => {
    const first = questForDate(date)
    expect(questForDate(date)).toEqual(first)
    expect(QUEST_TYPES).toContain(first.type)
  })
})
