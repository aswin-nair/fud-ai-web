import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { computeTargets, type TargetInput } from '@/logic/nutrition';

type ExpectedMobileTargets =
  | { ok: false }
  | {
      ok: true;
      bmr: number;
      tdee: number;
      dailyKcalTarget: number;
      proteinGTarget: number;
      carbsGTarget: number;
      fatGTarget: number;
      clamped: boolean;
    };

type TargetFixture = {
  schemaVersion: number;
  cases: {
    id: string;
    input: TargetInput & { weeklyChangeKg: number };
    mobile: ExpectedMobileTargets;
  }[];
};

const fixtureUrl = new URL(
  '../../../packages/domain/fixtures/targets.v1.json',
  import.meta.url,
);
const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8')) as TargetFixture;

function fixtureOutput(input: TargetInput): ExpectedMobileTargets {
  const result = computeTargets(input);
  if (!result.ok) return { ok: false };

  return {
    ok: true,
    ...result.targets,
    clamped: result.targets.clamped !== null,
  };
}

describe('shared targets.v1 mobile characterization', () => {
  it('uses the supported fixture schema and includes the BMI refusal case', () => {
    expect(fixture.schemaVersion).toBe(1);
    expect(fixture.cases.map(({ id }) => id)).toContain('goal-below-bmi-boundary');
  });

  it.each(fixture.cases)('$id', ({ input, mobile }) => {
    expect(fixtureOutput(input)).toEqual(mobile);
  });
});
