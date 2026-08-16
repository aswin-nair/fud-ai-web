import { describe, expect, it } from 'vitest';

import { award, isStreakMilestone, levelFor, POINTS, totalPoints } from '@/logic/points';

describe('points', () => {
  it('uses the values from the spec table', () => {
    expect(POINTS).toEqual({
      meal_logged: 10,
      first_log_of_day: 15,
      quest_completed: 25,
      streak_milestone: 50,
    });
  });

  it('awards nothing for nutrition outcomes or restriction', () => {
    // §2.3: points reward logging actions and genuine habit milestones, not
    // nutrition results. This asserts the shape of the table itself, so adding
    // an outcome-based reason fails even if its copy sounds encouraging.
    const reasons = Object.keys(POINTS);
    const banned = [
      'protein',
      'macro',
      'calorie',
      'target_hit',
      'deficit',
      'under_target',
      'ate_less',
      'skipped_meal',
      'fasted',
    ];

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
  it('matches the formula in §10.3', () => {
    for (const points of [0, 37, 99, 100, 250, 399, 400, 1234, 10_000]) {
      expect(levelFor(points).level).toBe(Math.floor(Math.sqrt(points / 100)) + 1);
    }
  });

  it('starts everyone at level 1', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, span: 100 });
  });

  it('stays on level 1 just below the threshold', () => {
    expect(levelFor(99).level).toBe(1);
  });

  it('advances at the threshold', () => {
    expect(levelFor(100).level).toBe(2);
  });

  it('widens each level so later ones take longer', () => {
    expect(levelFor(100).span).toBe(300);
    expect(levelFor(400).span).toBe(500);
    expect(levelFor(900).span).toBe(700);
  });

  it('reports progress into the current level', () => {
    expect(levelFor(250)).toEqual({ level: 2, into: 150, span: 300 });
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
