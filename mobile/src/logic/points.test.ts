import { describe, expect, it } from 'vitest';

import { award, isStreakMilestone, levelFor, POINTS, totalPoints } from '@/logic/points';

describe('points', () => {
  it('uses the values from the spec table', () => {
    expect(POINTS).toEqual({
      meal_logged: 10,
      first_log_of_day: 15,
      protein_target_hit: 20,
      quest_completed: 25,
      streak_milestone: 50,
    });
  });

  it('awards nothing for restriction', () => {
    // §2.3: no reason may reward eating less or ending under target. This
    // asserts the shape of the table itself, so adding such a reason fails.
    const reasons = Object.keys(POINTS);
    const banned = ['deficit', 'under_target', 'ate_less', 'skipped_meal', 'fasted'];

    for (const reason of reasons) {
      for (const word of banned) {
        expect(reason).not.toContain(word);
      }
    }
  });

  it('builds an award from a reason', () => {
    expect(award('meal_logged')).toEqual({ reason: 'meal_logged', delta: 10 });
  });

  it('sums an append-only ledger', () => {
    expect(totalPoints([{ delta: 10 }, { delta: 15 }, { delta: 25 }])).toBe(50);
  });

  it('sums an empty ledger to zero', () => {
    expect(totalPoints([])).toBe(0);
  });
});

describe('levelFor', () => {
  it('starts everyone at level 1', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, span: 250 });
  });

  it('stays on level 1 just below the threshold', () => {
    expect(levelFor(249).level).toBe(1);
  });

  it('advances at the threshold', () => {
    expect(levelFor(250).level).toBe(2);
  });

  it('widens each level so later ones take longer', () => {
    const second = levelFor(250);
    const third = levelFor(250 + 500);

    expect(second.span).toBe(500);
    expect(third.span).toBe(750);
  });

  it('reports progress into the current level', () => {
    expect(levelFor(300)).toEqual({ level: 2, into: 50, span: 500 });
  });

  it('never returns a level below 1', () => {
    expect(levelFor(-100).level).toBe(1);
  });
});

describe('isStreakMilestone', () => {
  it('recognises the milestone lengths', () => {
    for (const n of [3, 7, 14, 30, 60, 100, 180, 365]) {
      expect(isStreakMilestone(n)).toBe(true);
    }
  });

  it('ignores ordinary lengths', () => {
    for (const n of [0, 1, 2, 4, 8, 29, 99]) {
      expect(isStreakMilestone(n)).toBe(false);
    }
  });
});
