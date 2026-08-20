import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { defaultMealSlot } from '@/logic/mealSlot';

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/meals.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as {
  schemaVersion: number;
  cases: Array<{ hour: number; slot: string }>;
};

describe('shared meals.v1 mobile adapter', () => {
  it('uses the supported fixture schema', () => {
    expect(fixture.schemaVersion).toBe(1);
  });

  it.each(fixture.cases)('hour $hour -> $slot', ({ hour, slot }) => {
    expect(defaultMealSlot(hour)).toBe(slot);
  });
});
