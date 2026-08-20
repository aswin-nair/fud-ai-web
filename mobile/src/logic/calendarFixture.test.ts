import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { localHourIn, toLocalDate } from '@/logic/dates';

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/calendar.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as {
  schemaVersion: number;
  cases: Array<{ id: string; instant: string; timeZone: string; date: string; hour: number }>;
};

describe('shared calendar.v1 mobile adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1);
  });

  it.each(fixture.cases)('$id', (testCase) => {
    const instant = new Date(testCase.instant);
    expect(toLocalDate(instant, testCase.timeZone)).toBe(testCase.date);
    expect(localHourIn(testCase.timeZone, instant)).toBe(testCase.hour);
  });
});
