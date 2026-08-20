import {
  MOBILE_QUEST_CANDIDATES,
  QUEST_TYPES as SHARED_QUEST_TYPES,
  questForDate as sharedQuestForDate,
  questProgress as sharedQuestProgress,
  questTitle as sharedQuestTitle,
  seedFor as sharedSeedFor,
  type QuestType as SharedQuestType,
} from '@fud-ai/domain/quests';
import { type MealSlot } from '@/db/schema';
import { type LocalDate } from '@/logic/dates';

/**
 * §10.1: every quest is about logging *behaviour*. There is deliberately no
 * quest type for reaching a nutrition outcome, staying under target, running a
 * deficit, or avoiding a food group — see §2.3. This union is the enforcement
 * point: adding an outcome-based quest means adding a member here, which the
 * test suite rejects.
 */
export type QuestType = SharedQuestType;

export const QUEST_TYPES: readonly QuestType[] = SHARED_QUEST_TYPES;

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
  streakCount: number;
};

/**
 * A 32-bit FNV-1a hash of the date string. Seeding from `local_date` alone is
 * what makes the quest stable across relaunches — regenerating on every cold
 * start would let someone reroll an inconvenient quest by force-quitting.
 */
export function seedFor(date: LocalDate): number {
  return sharedSeedFor(date);
}

/**
 * Deterministic in `date`, so the same day always yields the same quest no
 * matter how many times the app is relaunched, and so the cutoff hour can be
 * recovered without a column to store it in.
 *
 * Mobile keeps a fourth candidate slot so older `hit_protein` dates stay
 * stable. That list is a recorded platform exception.
 */
export function questForDate(date: LocalDate): QuestSpec {
  return sharedQuestForDate(date, MOBILE_QUEST_CANDIDATES);
}

/**
 * Restores a persisted quest without allowing an old nutrition-outcome type
 * back into the live domain. `quests.type` is plain text, so installs upgraded
 * from a release that stored `hit_protein` must remain readable. The stable
 * candidate slot above turns those rows into a logging quest; known current
 * types retain their persisted target and unknown strings fall back safely.
 */
export function questSpecFromStored(
  date: LocalDate,
  storedType: string,
  storedTarget: number,
): QuestSpec {
  const generated = questForDate(date);
  const type = isQuestType(storedType) ? storedType : generated.type;

  return {
    type,
    target: reachableTarget(type, storedTarget, generated.target),
    beforeHour:
      type === 'log_before'
        ? generated.type === 'log_before'
          ? generated.beforeHour
          : 10
        : undefined,
  };
}

function isQuestType(value: string): value is QuestType {
  return (QUEST_TYPES as readonly string[]).includes(value);
}

function reachableTarget(type: QuestType, stored: number, fallback: number): number {
  if (!Number.isFinite(stored)) return fallback;

  const rounded = Math.max(1, Math.round(stored));
  if (type === 'log_n_meals') return Math.min(rounded, 4);
  if (type === 'log_before') return 1;
  return Math.min(rounded, 3);
}

/**
 * Recomputed from today's entries rather than incremented, so deleting an
 * entry correctly walks the quest back instead of leaving it inflated.
 */
export function questProgress(spec: QuestSpec, input: QuestProgressInput): number {
  return sharedQuestProgress(spec, {
    entriesToday: input.entriesToday.map((entry) => ({
      mealSlot: entry.mealSlot,
      localHour: entry.loggedLocalHour,
    })),
    streakCount: input.streakCount,
  });
}

export function isComplete(spec: QuestSpec, progress: number): boolean {
  return progress >= spec.target;
}

/** Player-facing copy. Always an action to take, never a limit to stay under. */
export function questTitle(spec: QuestSpec): string {
  return sharedQuestTitle(spec);
}
