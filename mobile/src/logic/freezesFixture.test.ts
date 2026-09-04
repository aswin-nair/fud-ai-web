import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { planFreeze } from '@/logic/freezes';

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/freezes.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as {
  schemaVersion: number;
  cases: {
    id: string;
    loggedDates: string[];
    freezeDates: string[];
    today: string;
    available: number;
    cover: string[];
    protectedStreak: number;
  }[];
};

describe('shared freezes.v1 mobile adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1);
  });

  it.each(fixture.cases)('$id', (testCase) => {
    expect(planFreeze(
      testCase.loggedDates,
      testCase.freezeDates,
      testCase.today,
      testCase.available,
    )).toEqual({
      cover: testCase.cover,
      protectedStreak: testCase.protectedStreak,
    });
  });
});
