import { describe, expect, it } from 'vitest';

import {
  isComplete,
  QUEST_TYPES,
  questForDate,
  questProgress,
  questTitle,
  type QuestSpec,
} from '@/logic/quests';

const dates = Array.from(
  { length: 400 },
  (_, i) => `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
);

describe('questForDate', () => {
  it('is stable across relaunches on the same day', () => {
    // The acceptance criterion: same date in, same quest out, every time.
    for (const date of dates.slice(0, 50)) {
      const first = questForDate(date);

      for (let i = 0; i < 5; i += 1) {
        expect(questForDate(date)).toEqual(first);
      }
    }
  });

  it('only ever emits an allowed type', () => {
    for (const date of dates) {
      expect(QUEST_TYPES).toContain(questForDate(date).type);
    }
  });

  it('varies across days rather than pinning one quest forever', () => {
    const seen = new Set(dates.map((d) => questForDate(d).type));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('gives log_before a cutoff hour and the others none', () => {
    for (const date of dates) {
      const spec = questForDate(date);

      if (spec.type === 'log_before') {
        expect(spec.beforeHour).toBeGreaterThan(0);
      } else {
        expect(spec.beforeHour).toBeUndefined();
      }
    }
  });

  it('always sets a reachable target', () => {
    for (const date of dates) {
      const { target } = questForDate(date);

      expect(target).toBeGreaterThan(0);
      expect(target).toBeLessThanOrEqual(4);
    }
  });
});

describe('quest copy', () => {
  it('never references restriction, deficit, or avoiding food', () => {
    // §2.3 and the Phase 6 acceptance criterion. Checks generated copy, not
    // just the type union, so a reworded title cannot smuggle a limit in.
    // Whole words only — "breakfast" legitimately contains "fast".
    const banned = [
      /\bunder\b/,
      /\bdeficit\b/,
      /\brestrict/,
      /\bavoid\b/,
      /\bless\b/,
      /\bcut\b/,
      /\blimit\b/,
      /\bskip\b/,
      /\bfast(ing)?\b/,
      /\bburn\b/,
      /\bbelow\b/,
      /\bcheat\b/,
    ];

    for (const date of dates) {
      const title = questTitle(questForDate(date)).toLowerCase();

      for (const pattern of banned) {
        expect(title).not.toMatch(pattern);
      }
    }
  });

  it('phrases every quest as an action', () => {
    for (const date of dates) {
      expect(questTitle(questForDate(date))).toMatch(/^(Log|Hit)\b/);
    }
  });
});

describe('questProgress', () => {
  const empty = { entriesToday: [], proteinG: 0, proteinTargetG: 140, streakCount: 0 };

  it('counts distinct meal slots, not rows', () => {
    const spec: QuestSpec = { type: 'log_n_meals', target: 3 };

    const threeSnacks = [
      { mealSlot: 'snack' as const, loggedLocalHour: 9 },
      { mealSlot: 'snack' as const, loggedLocalHour: 14 },
      { mealSlot: 'snack' as const, loggedLocalHour: 20 },
    ];

    expect(questProgress(spec, { ...empty, entriesToday: threeSnacks })).toBe(1);

    const threeMeals = [
      { mealSlot: 'breakfast' as const, loggedLocalHour: 8 },
      { mealSlot: 'lunch' as const, loggedLocalHour: 13 },
      { mealSlot: 'dinner' as const, loggedLocalHour: 19 },
    ];

    expect(questProgress(spec, { ...empty, entriesToday: threeMeals })).toBe(3);
  });

  it('completes hit_protein only at or above target', () => {
    const spec: QuestSpec = { type: 'hit_protein', target: 1 };

    expect(questProgress(spec, { ...empty, proteinG: 139 })).toBe(0);
    expect(questProgress(spec, { ...empty, proteinG: 140 })).toBe(1);
    expect(questProgress(spec, { ...empty, proteinG: 200 })).toBe(1);
  });

  it('does not complete hit_protein when there is no target to hit', () => {
    const spec: QuestSpec = { type: 'hit_protein', target: 1 };
    expect(questProgress(spec, { ...empty, proteinG: 50, proteinTargetG: 0 })).toBe(0);
  });

  it('completes log_before only on an entry before the cutoff', () => {
    const spec: QuestSpec = { type: 'log_before', target: 1, beforeHour: 10 };

    const late = [{ mealSlot: 'breakfast' as const, loggedLocalHour: 10 }];
    const early = [{ mealSlot: 'breakfast' as const, loggedLocalHour: 9 }];

    expect(questProgress(spec, { ...empty, entriesToday: late })).toBe(0);
    expect(questProgress(spec, { ...empty, entriesToday: early })).toBe(1);
  });

  it('caps log_streak at its target', () => {
    const spec: QuestSpec = { type: 'log_streak', target: 3 };

    expect(questProgress(spec, { ...empty, streakCount: 1 })).toBe(1);
    expect(questProgress(spec, { ...empty, streakCount: 9 })).toBe(3);
  });

  it('walks back when an entry is removed', () => {
    const spec: QuestSpec = { type: 'log_n_meals', target: 3 };

    const two = [
      { mealSlot: 'breakfast' as const, loggedLocalHour: 8 },
      { mealSlot: 'lunch' as const, loggedLocalHour: 13 },
    ];

    expect(questProgress(spec, { ...empty, entriesToday: two })).toBe(2);
    expect(questProgress(spec, { ...empty, entriesToday: two.slice(0, 1) })).toBe(1);
  });
});

describe('isComplete', () => {
  it('completes at the target and stays complete above it', () => {
    const spec: QuestSpec = { type: 'log_n_meals', target: 3 };

    expect(isComplete(spec, 2)).toBe(false);
    expect(isComplete(spec, 3)).toBe(true);
    expect(isComplete(spec, 4)).toBe(true);
  });
});
