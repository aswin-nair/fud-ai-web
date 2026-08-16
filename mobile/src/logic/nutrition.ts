import { type ActivityLevel, type Goal, type Sex } from '@/db/schema';

/**
 * Implements §2.1. Every number here is a safety floor, not a preference —
 * see the module tests before changing any of them.
 */

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/** Hard calorie floors. Never produce a target below these. */
export const KCAL_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 };

/** Deficits are capped at a quarter of maintenance. */
export const MAX_DEFICIT_FRACTION = 0.25;

/** Rate-of-change selector cap, as a percent of bodyweight per week. */
export const MAX_WEEKLY_RATE_PCT = 1;

/** Below this BMI a goal weight is refused outright. */
export const MIN_BMI = 18.5;

const KCAL_PER_KG = 7700;
const DAYS_PER_WEEK = 7;

/** Grams of protein per kg of bodyweight, and the share of energy from fat. */
const PROTEIN_G_PER_KG = 1.8;
const FAT_ENERGY_SHARE = 0.25;

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export type TargetInput = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Percent of bodyweight per week. Clamped to MAX_WEEKLY_RATE_PCT. */
  weeklyRatePct: number;
  goalWeightKg?: number;
};

export type Targets = {
  bmr: number;
  tdee: number;
  dailyKcalTarget: number;
  proteinGTarget: number;
  carbsGTarget: number;
  fatGTarget: number;
  /**
   * Plain-language explanation, present whenever a floor or cap changed the
   * number the user asked for. §2.1 forbids clamping silently.
   */
  clamped: string | null;
};

export type TargetResult =
  | { ok: true; targets: Targets }
  | { ok: false; reason: string };

/** Mifflin-St Jeor. */
export function computeBmr(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return input.sex === 'male' ? base + 5 : base - 161;
}

export function computeBmi(weightKg: number, heightCm: number): number {
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

/** The lowest weight that still clears MIN_BMI at this height. */
export function minimumHealthyWeightKg(heightCm: number): number {
  const metres = heightCm / 100;
  return MIN_BMI * metres * metres;
}

export function computeTargets(input: TargetInput): TargetResult {
  if (input.heightCm <= 0 || input.weightKg <= 0 || input.ageYears <= 0) {
    return { ok: false, reason: 'Enter a valid height, weight and date of birth to continue.' };
  }

  if (input.goalWeightKg !== undefined) {
    const goalBmi = computeBmi(input.goalWeightKg, input.heightCm);

    if (goalBmi < MIN_BMI) {
      const floor = minimumHealthyWeightKg(input.heightCm);
      return {
        ok: false,
        reason:
          `A goal of ${round(input.goalWeightKg, 1)} kg puts you at a BMI of ` +
          `${round(goalBmi, 1)}, below the healthy range. For your height the ` +
          `lowest goal this app supports is ${round(floor, 1)} kg. If you want ` +
          `to go lower than that, please talk to a doctor first.`,
      };
    }
  }

  const notes: string[] = [];

  let rate = input.weeklyRatePct;
  if (rate > MAX_WEEKLY_RATE_PCT) {
    rate = MAX_WEEKLY_RATE_PCT;
    notes.push(
      `We capped your rate at ${MAX_WEEKLY_RATE_PCT}% of bodyweight per week, ` +
        `which is the fastest pace this app will plan for.`,
    );
  }
  if (rate < 0) rate = 0;

  const bmr = computeBmr(input);
  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activityLevel];

  const requested = (input.weightKg * (rate / 100) * KCAL_PER_KG) / DAYS_PER_WEEK;
  const maxDeficit = tdee * MAX_DEFICIT_FRACTION;

  let dailyKcalTarget: number;

  if (input.goal === 'maintain') {
    dailyKcalTarget = tdee;
  } else if (input.goal === 'gain') {
    dailyKcalTarget = tdee + requested;
  } else {
    const deficit = Math.min(requested, maxDeficit);

    if (requested > maxDeficit) {
      notes.push(
        `We reduced your daily deficit to ${Math.round(maxDeficit)} kcal, a ` +
          `quarter of your maintenance. Larger deficits cost muscle and are ` +
          `harder to stick to.`,
      );
    }

    dailyKcalTarget = tdee - deficit;
  }

  const floor = KCAL_FLOOR[input.sex];
  const raised = Math.max(dailyKcalTarget, floor, bmr);

  if (raised > dailyKcalTarget) {
    const bound = floor >= bmr ? floor : Math.round(bmr);
    notes.push(
      floor >= bmr
        ? `We raised your target to ${Math.round(raised)} kcal. ${bound} kcal is ` +
          `the lowest this app will set for you.`
        : `We raised your target to ${Math.round(raised)} kcal, which matches ` +
          `the energy your body uses at rest. Eating below that is not ` +
          `something this app will plan for.`,
    );
  }

  // Persist the final target conservatively. Display BMR/TDEE may be rounded
  // normally, but a nearest-integer target could otherwise land fractionally
  // below the raw BMR or 75%-of-TDEE safety boundary.
  dailyKcalTarget = Math.ceil(raised);

  return {
    ok: true,
    targets: {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      dailyKcalTarget,
      ...splitMacros(dailyKcalTarget, input.weightKg),
      clamped: notes.length ? notes.join(' ') : null,
    },
  };
}

/**
 * Protein is anchored to bodyweight rather than a percentage of calories so it
 * does not collapse when the calorie target is low. Fat takes a fixed share of
 * energy and carbohydrate absorbs the remainder.
 */
function splitMacros(kcal: number, weightKg: number) {
  const proteinG = Math.round(PROTEIN_G_PER_KG * weightKg);
  const fatG = Math.round((kcal * FAT_ENERGY_SHARE) / KCAL_PER_G.fat);

  const remaining = kcal - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;
  const carbsG = Math.max(Math.round(remaining / KCAL_PER_G.carbs), 0);

  return { proteinGTarget: proteinG, carbsGTarget: carbsG, fatGTarget: fatG };
}

export function ageOn(dateOfBirth: string, on: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  let age = on.getFullYear() - (year as number);

  const beforeBirthday =
    on.getMonth() + 1 < (month as number) ||
    (on.getMonth() + 1 === (month as number) && on.getDate() < (day as number));

  if (beforeBirthday) age -= 1;
  return age;
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
