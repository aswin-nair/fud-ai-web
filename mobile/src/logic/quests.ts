import { type MealSlot } from '@/db/schema';
import { type LocalDate } from '@/logic/dates';

/**
 * §10.1: every quest is about logging *behaviour*. There is deliberately no
 * quest type for staying under target, running a deficit, or avoiding a food
 * group — see §2.3. This union is the enforcement point: adding a restriction
 * quest means adding a member here, which the test suite rejects.
 */
export type QuestType = 'log_n_meals' | 'hit_protein' | 'log_before' | 'log_streak';

export const QUEST_TYPES: readonly QuestType[] = [
  'log_n_meals',
  'hit_protein',
  'log_before',
  'log_streak',
];

export type QuestSpec = {
  type: QuestType;
  /** What `progress` must reach to complete. Always a count, so a progress bar reads sensibly. */
  target: number;
  /** Cutoff hour for `log_before`. Re-derived from the date, never stored. */
  beforeHour?: number;
};

export type QuestProgressInput = {
  /** Today's entries, in the profile's timezone. */
  entriesToday: readonly { mealSlot: MealSlot; loggedLocalHour: number }[];
  proteinG: number;
  proteinTargetG: number;
  streakCount: number;
};

/**
 * A 32-bit FNV-1a hash of the date string. Seeding from `local_date` alone is
 * what makes the quest stable across relaunches — regenerating on every cold
 * start would let someone reroll an inconvenient quest by force-quitting.
 */
export function seedFor(date: LocalDate): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < date.length; i += 1) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}

type Candidate = {
  type: QuestType;
  /** Completion thresholds to choose between. */
  targets: readonly number[];
  /** Cutoff hours, for `log_before` only. */
  hours?: readonly number[];
};

const CANDIDATES: readonly Candidate[] = [
  { type: 'log_n_meals', targets: [2, 3, 4] },
  { type: 'hit_protein', targets: [1] },
  { type: 'log_before', targets: [1], hours: [10, 11] },
  { type: 'log_streak', targets: [2, 3] },
];

/**
 * Deterministic in `date`, so the same day always yields the same quest no
 * matter how many times the app is relaunched, and so the cutoff hour can be
 * recovered without a column to store it in.
 */
export function questForDate(date: LocalDate): QuestSpec {
  const seed = seedFor(date);

  const candidate = CANDIDATES[seed % CANDIDATES.length] as Candidate;

  // Independent draws off the same seed, so the target does not move in
  // lockstep with the type across consecutive days.
  const target = pick(candidate.targets, Math.floor(seed / CANDIDATES.length));

  if (!candidate.hours) {
    return { type: candidate.type, target };
  }

  return {
    type: candidate.type,
    target,
    beforeHour: pick(candidate.hours, Math.floor(seed / 7)),
  };
}

function pick<T>(options: readonly T[], draw: number): T {
  return options[draw % options.length] as T;
}

/**
 * Recomputed from today's entries rather than incremented, so deleting an
 * entry correctly walks the quest back instead of leaving it inflated.
 */
export function questProgress(spec: QuestSpec, input: QuestProgressInput): number {
  switch (spec.type) {
    case 'log_n_meals':
      return distinctSlots(input.entriesToday);

    case 'hit_protein':
      return input.proteinTargetG > 0 && input.proteinG >= input.proteinTargetG ? 1 : 0;

    case 'log_before': {
      const cutoff = spec.beforeHour ?? 10;
      return input.entriesToday.some((e) => e.loggedLocalHour < cutoff) ? 1 : 0;
    }

    case 'log_streak':
      return Math.min(input.streakCount, spec.target);
  }
}

export function isComplete(spec: QuestSpec, progress: number): boolean {
  return progress >= spec.target;
}

/**
 * Distinct slots rather than rows, so "log 3 meals" is not satisfied by three
 * snacks logged in one sitting.
 */
function distinctSlots(entries: QuestProgressInput['entriesToday']): number {
  return new Set(entries.map((e) => e.mealSlot)).size;
}

/** Player-facing copy. Always an action to take, never a limit to stay under. */
export function questTitle(spec: QuestSpec): string {
  switch (spec.type) {
    case 'log_n_meals':
      return `Log ${spec.target} meals today`;

    case 'hit_protein':
      return 'Hit your protein target';

    case 'log_before':
      return `Log breakfast before ${formatHour(spec.beforeHour ?? 10)}`;

    case 'log_streak':
      return `Log something ${spec.target} days running`;
  }
}

function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  const display = hour % 12 === 0 ? 12 : hour % 12;

  return `${display}${suffix}`;
}
