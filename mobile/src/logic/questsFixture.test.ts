import { readFileSync } from 'node:fs';

import { QUEST_TYPES } from '@fud-ai/domain/quests';
import { describe, expect, it } from 'vitest';

import { questForDate } from '@/logic/quests';

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/quests.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as {
  schemaVersion: number;
  dates: string[];
};

describe('shared quests.v1 mobile adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1);
  });

  it.each(fixture.dates)('stays stable for %s', (date) => {
    const first = questForDate(date);
    expect(questForDate(date)).toEqual(first);
    expect(QUEST_TYPES).toContain(first.type);
  });
});
