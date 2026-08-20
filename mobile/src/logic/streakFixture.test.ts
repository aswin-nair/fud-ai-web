import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { deriveStreak, type Streak } from '@/logic/streak';

type FixtureCase = {
  id: string;
  today: string;
  localHour: number;
  loggedDates: string[];
  freezeDates: string[];
  neutralDates: string[];
  expected: Streak;
};

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/streaks.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as {
  schemaVersion: number;
  cases: FixtureCase[];
};

describe('shared streaks.v1 mobile adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1);
  });

  it.each(fixture.cases)('$id', (testCase) => {
    expect(deriveStreak(
      testCase.loggedDates,
      testCase.freezeDates,
      testCase.today,
      testCase.localHour,
      testCase.neutralDates,
    )).toEqual(testCase.expected);
  });
});
