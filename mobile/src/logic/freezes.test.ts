import { describe, expect, it } from 'vitest';

import { freezeNotice, planFreeze } from '@/logic/freezes';
import { deriveStreak } from '@/logic/streak';

describe('planFreeze', () => {
  it('covers a missed yesterday when a freeze is available', () => {
    const logged = ['2026-08-12', '2026-08-13', '2026-08-14'];

    const plan = planFreeze(logged, [], '2026-08-16', 1);

    expect(plan.cover).toEqual(['2026-08-15']);
    expect(plan.protectedStreak).toBe(4);
  });

  it('does nothing when no freeze is available', () => {
    const logged = ['2026-08-13', '2026-08-14'];
    expect(planFreeze(logged, [], '2026-08-16', 0).cover).toEqual([]);
  });

  it('does nothing when yesterday was logged', () => {
    const logged = ['2026-08-14', '2026-08-15'];
    expect(planFreeze(logged, [], '2026-08-16', 1).cover).toEqual([]);
  });

  it('does nothing when yesterday is already covered by an earlier freeze', () => {
    const plan = planFreeze(['2026-08-14'], ['2026-08-15'], '2026-08-16', 1);
    expect(plan.cover).toEqual([]);
  });

  it('refuses to resurrect a streak that was already broken', () => {
    // Two consecutive missed days: the run ended before the freeze could help,
    // so the month's only freeze is not spent on it.
    const logged = ['2026-08-10', '2026-08-11', '2026-08-12'];
    expect(planFreeze(logged, [], '2026-08-16', 1).cover).toEqual([]);
  });

  it('does not spend a freeze for a user who has never logged', () => {
    expect(planFreeze([], [], '2026-08-16', 1).cover).toEqual([]);
  });

  it('counts a prior freeze into the protected streak', () => {
    const logged = ['2026-08-11', '2026-08-12', '2026-08-14'];
    const frozen = ['2026-08-13'];

    const plan = planFreeze(logged, frozen, '2026-08-16', 1);

    expect(plan.cover).toEqual(['2026-08-15']);
    expect(plan.protectedStreak).toBe(5);
  });

  it('preserves the streak silently once applied', () => {
    // The acceptance criterion, end to end: simulate the missed day, apply the
    // plan, and check deriveStreak reports an unbroken run.
    const logged = ['2026-08-12', '2026-08-13', '2026-08-14'];
    const today = '2026-08-16';

    const before = deriveStreak(logged, [], today, 9);
    expect(before.count).toBe(0);

    const plan = planFreeze(logged, [], today, 1);
    const after = deriveStreak(logged, plan.cover, today, 9);

    expect(after.count).toBe(4);
    expect(after.count).toBe(plan.protectedStreak);
  });
});

describe('freezeNotice', () => {
  it('matches the wording in the spec', () => {
    expect(freezeNotice(23)).toBe('Your freeze covered yesterday. Streak safe at 23.');
  });

  it('never asks for anything or mentions a purchase', () => {
    const text = freezeNotice(7).toLowerCase();

    for (const word of ['buy', 'upgrade', 'unlock', 'pro', '?']) {
      expect(text).not.toContain(word);
    }
  });
});
