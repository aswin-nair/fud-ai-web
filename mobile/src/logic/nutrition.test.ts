import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_MULTIPLIER,
  ageOn,
  computeBmi,
  computeBmr,
  computeTargets,
  KCAL_FLOOR,
  MAX_DEFICIT_FRACTION,
  minimumHealthyWeightKg,
  type TargetInput,
} from '@/logic/nutrition';

const base: TargetInput = {
  sex: 'male',
  ageYears: 30,
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderate',
  goal: 'lose',
  weeklyRatePct: 0.5,
};

const unwrap = (input: TargetInput) => {
  const result = computeTargets(input);
  if (!result.ok) throw new Error(`expected ok, got: ${result.reason}`);
  return result.targets;
};

describe('computeBmr', () => {
  it('matches Mifflin-St Jeor for men', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(computeBmr({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 })).toBe(1780);
  });

  it('matches Mifflin-St Jeor for women', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25
    expect(computeBmr({ sex: 'female', weightKg: 65, heightCm: 165, ageYears: 30 })).toBeCloseTo(
      1370.25,
      2,
    );
  });
});

describe('computeTargets', () => {
  it('applies the activity multiplier to reach TDEE', () => {
    const t = unwrap(base);
    expect(t.bmr).toBe(1780);
    expect(t.tdee).toBe(Math.round(1780 * 1.55));
  });

  it('sets maintenance equal to TDEE', () => {
    const t = unwrap({ ...base, goal: 'maintain' });
    expect(t.dailyKcalTarget).toBe(t.tdee);
    expect(t.clamped).toBeNull();
  });

  it('subtracts a modest deficit without complaining', () => {
    const t = unwrap(base);
    expect(t.dailyKcalTarget).toBeLessThan(t.tdee);
    expect(t.clamped).toBeNull();
  });

  it('adds a surplus when gaining', () => {
    const t = unwrap({ ...base, goal: 'gain' });
    expect(t.dailyKcalTarget).toBeGreaterThan(t.tdee);
  });

  describe('clamping', () => {
    it('rounds persisted targets up across fractional safety boundaries', () => {
      const bmrFloorInput: TargetInput = {
        sex: 'female',
        ageYears: 30,
        heightCm: 165,
        weightKg: 65,
        activityLevel: 'sedentary',
        goal: 'lose',
        weeklyRatePct: 1,
      };
      const bmrFloor = unwrap(bmrFloorInput);
      const rawBmr = computeBmr(bmrFloorInput);

      expect(bmrFloor.bmr).toBe(Math.round(rawBmr));
      expect(bmrFloor.dailyKcalTarget).toBe(Math.ceil(rawBmr));
      expect(bmrFloor.dailyKcalTarget).toBeGreaterThanOrEqual(rawBmr);

      const deficitFloorInput: TargetInput = {
        sex: 'male',
        ageYears: 40,
        heightCm: 175,
        weightKg: 100,
        activityLevel: 'light',
        goal: 'lose',
        weeklyRatePct: 2,
      };
      const deficitFloor = unwrap(deficitFloorInput);
      const rawTdee = computeBmr(deficitFloorInput) * ACTIVITY_MULTIPLIER.light;
      const rawDeficitFloor = rawTdee * (1 - MAX_DEFICIT_FRACTION);

      expect(deficitFloor.tdee).toBe(Math.round(rawTdee));
      expect(deficitFloor.dailyKcalTarget).toBe(Math.ceil(rawDeficitFloor));
      expect(deficitFloor.dailyKcalTarget).toBeGreaterThanOrEqual(rawDeficitFloor);
    });

    it('caps the deficit at a quarter of maintenance and explains why', () => {
      const t = unwrap({ ...base, weeklyRatePct: 1 });
      const floorOfDeficit = t.tdee * (1 - MAX_DEFICIT_FRACTION);

      expect(t.dailyKcalTarget).toBeGreaterThanOrEqual(Math.floor(floorOfDeficit));
      expect(t.clamped).toContain('quarter of your maintenance');
    });

    it('caps a rate above 1% per week and explains why', () => {
      const t = unwrap({ ...base, weeklyRatePct: 2.5 });
      expect(t.clamped).toContain('1% of bodyweight per week');
    });

    it('never returns a target below the sex-specific floor', () => {
      // A small, sedentary woman asking for the fastest permitted loss.
      const t = unwrap({
        sex: 'female',
        ageYears: 55,
        heightCm: 150,
        weightKg: 48,
        activityLevel: 'sedentary',
        goal: 'lose',
        weeklyRatePct: 1,
      });

      expect(t.dailyKcalTarget).toBeGreaterThanOrEqual(KCAL_FLOOR.female);
      expect(t.clamped).not.toBeNull();
    });

    it('never returns a target below BMR', () => {
      const t = unwrap({
        sex: 'male',
        ageYears: 25,
        heightCm: 195,
        weightKg: 120,
        activityLevel: 'sedentary',
        goal: 'lose',
        weeklyRatePct: 1,
      });

      expect(t.dailyKcalTarget).toBeGreaterThanOrEqual(t.bmr);
      expect(t.clamped).not.toBeNull();
    });

    it('returns a usable explanation rather than a bare number', () => {
      const t = unwrap({ ...base, weeklyRatePct: 3 });

      expect(typeof t.clamped).toBe('string');
      expect((t.clamped as string).length).toBeGreaterThan(20);
    });

    it('uses no shaming language in the explanation', () => {
      const banned = ['bad', 'cheat', 'guilty', 'earned', 'burn it off', 'naughty', 'sinful'];
      const t = unwrap({ ...base, weeklyRatePct: 3 });

      for (const word of banned) {
        expect((t.clamped as string).toLowerCase()).not.toContain(word);
      }
    });
  });

  describe('goal weight', () => {
    it('rejects a goal weight implying BMI below 18.5', () => {
      const result = computeTargets({ ...base, goalWeightKg: 55 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain('below the healthy range');
        expect(result.reason).toContain('doctor');
      }
    });

    it('accepts a goal weight at the healthy boundary', () => {
      const floor = minimumHealthyWeightKg(base.heightCm);
      const result = computeTargets({ ...base, goalWeightKg: Math.ceil(floor) });

      expect(result.ok).toBe(true);
    });

    it('names the lowest supported weight so the user knows what to enter', () => {
      const result = computeTargets({ ...base, goalWeightKg: 50 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const floor = minimumHealthyWeightKg(base.heightCm).toFixed(1);
        expect(result.reason).toContain(floor);
      }
    });
  });

  describe('macros', () => {
    it('splits into macros that add back up to the calorie target', () => {
      const t = unwrap(base);
      const fromMacros = t.proteinGTarget * 4 + t.carbsGTarget * 4 + t.fatGTarget * 9;

      expect(Math.abs(fromMacros - t.dailyKcalTarget)).toBeLessThanOrEqual(4);
    });

    it('scales protein with bodyweight, not with calories', () => {
      const light = unwrap({ ...base, weightKg: 60 });
      const heavy = unwrap({ ...base, weightKg: 100 });

      expect(heavy.proteinGTarget).toBeGreaterThan(light.proteinGTarget);
    });

    it('never returns a negative carbohydrate target', () => {
      const t = unwrap({
        sex: 'female',
        ageYears: 60,
        heightCm: 148,
        weightKg: 95,
        activityLevel: 'sedentary',
        goal: 'lose',
        weeklyRatePct: 1,
      });

      expect(t.carbsGTarget).toBeGreaterThanOrEqual(0);
    });
  });

  it('refuses obviously invalid measurements', () => {
    expect(computeTargets({ ...base, heightCm: 0 }).ok).toBe(false);
    expect(computeTargets({ ...base, weightKg: 0 }).ok).toBe(false);
    expect(computeTargets({ ...base, ageYears: 0 }).ok).toBe(false);
  });

  it.each(['ageYears', 'heightCm', 'weightKg', 'weeklyRatePct'] as const)(
    'rejects non-finite %s values',
    (field) => {
      for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        expect(computeTargets({ ...base, [field]: value }).ok).toBe(false);
      }
    },
  );

  it('rejects a non-finite optional goal weight', () => {
    for (const goalWeightKg of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(computeTargets({ ...base, goalWeightKg }).ok).toBe(false);
    }
  });

  it('rejects negative measurements and rates instead of converting them into targets', () => {
    expect(computeTargets({ ...base, ageYears: -1 }).ok).toBe(false);
    expect(computeTargets({ ...base, heightCm: -1 }).ok).toBe(false);
    expect(computeTargets({ ...base, weightKg: -1 }).ok).toBe(false);
    expect(computeTargets({ ...base, weeklyRatePct: -0.1 }).ok).toBe(false);
    expect(computeTargets({ ...base, goalWeightKg: -1 }).ok).toBe(false);
  });

  it('rejects finite values outside the supported input ranges', () => {
    expect(computeTargets({ ...base, ageYears: 131 }).ok).toBe(false);
    expect(computeTargets({ ...base, heightCm: 301 }).ok).toBe(false);
    expect(computeTargets({ ...base, weightKg: 1001 }).ok).toBe(false);
    expect(computeTargets({ ...base, weeklyRatePct: 101 }).ok).toBe(false);
    expect(computeTargets({ ...base, goalWeightKg: 1001 }).ok).toBe(false);
  });

  it.each([
    { field: 'sex', value: 'other' },
    { field: 'activityLevel', value: 'extreme' },
    { field: 'goal', value: 'bulk' },
    { field: 'sex', value: null },
    { field: 'activityLevel', value: null },
    { field: 'goal', value: null },
  ] as const)('rejects an invalid runtime $field enum value', ({ field, value }) => {
    const input = { ...base, [field]: value } as unknown as TargetInput;
    expect(computeTargets(input).ok).toBe(false);
  });
});

describe('computeBmi', () => {
  it('computes BMI from height and weight', () => {
    expect(computeBmi(80, 180)).toBeCloseTo(24.69, 2);
  });
});

describe('ageOn', () => {
  it('counts a birthday that has already passed this year', () => {
    expect(ageOn('1990-01-15', new Date('2026-07-07'))).toBe(36);
  });

  it('does not count a birthday still to come this year', () => {
    expect(ageOn('1990-12-15', new Date('2026-07-07'))).toBe(35);
  });

  it('counts the birthday itself', () => {
    expect(ageOn('1990-07-07', new Date('2026-07-07'))).toBe(36);
  });

  it('is one day short the day before the birthday', () => {
    expect(ageOn('1990-07-08', new Date('2026-07-07'))).toBe(35);
  });
});
