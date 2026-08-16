import { getLoggedDates } from '@/db/queries/entries';
import {
  consumeFreeze,
  getAvailableFreeze,
  getConsumedFreezeDates,
  countAvailableFreezes,
  grantMonthlyFreezeIfDue,
} from '@/db/queries/freezes';
import { awardPoints, hasAwarded } from '@/db/queries/points';
import { toLocalDate, type LocalDate } from '@/logic/dates';
import { freezeNotice, planFreeze } from '@/logic/freezes';
import { isStreakMilestone } from '@/logic/points';
import { deriveStreak } from '@/logic/streak';
import { refreshDay } from '@/stores/dayStore';
import { syncQuest, useQuestStore } from '@/stores/questStore';

export type FreezeApplied = { date: LocalDate; protectedStreak: number; message: string };

/**
 * What a log turned out to be worth, so the caller can choose the right
 * celebration cue. Returned rather than read back off a store, so the log flow
 * cannot mistake a quest completed by an earlier entry for this one.
 */
export type LogOutcome = { questCompleted: boolean; streakMilestone: boolean };

/**
 * First-open-of-the-day work, run before anything renders a streak so the user
 * never sees a broken one flash before the freeze rescues it.
 *
 * Returns the freeze that was applied, if any, so the caller can schedule the
 * gentle next-morning notice. Nothing here prompts or asks — §10.2 is explicit
 * that a freeze is applied silently and never sold.
 */
export async function openSession(timezone: string): Promise<FreezeApplied | null> {
  const today = toLocalDate(new Date(), timezone);

  await grantMonthlyFreezeIfDue(today);

  const [loggedDates, freezeDates, available] = await Promise.all([
    getLoggedDates(),
    getConsumedFreezeDates(),
    countAvailableFreezes(),
  ]);

  const plan = planFreeze(loggedDates, freezeDates, today, available);
  const date = plan.cover[0];
  if (!date) return null;

  const freeze = await getAvailableFreeze();
  if (!freeze) return null;

  await consumeFreeze(freeze.id, date);

  return {
    date,
    protectedStreak: plan.protectedStreak,
    message: freezeNotice(plan.protectedStreak),
  };
}

/**
 * Everything that happens after an entry is written: points, quest progress,
 * and a refresh of the day. Kept in one place so the log flow and the edit
 * screen cannot drift apart on what a log is worth.
 */
export async function recordLog(timezone: string): Promise<LogOutcome> {
  const today = toLocalDate(new Date(), timezone);

  await awardPoints('meal_logged', today);

  if (!(await hasAwarded('first_log_of_day', today))) {
    await awardPoints('first_log_of_day', today);
  }

  const streakMilestone = await awardStreakMilestone(timezone, today);

  // The quest store only computes progress. This command is the sole owner of
  // turning a completion into points, so edit/delete sync cannot award XP.
  const { newlyCompleted } = await syncQuest(timezone, true);
  const questCompleted =
    newlyCompleted && !(await hasAwarded('quest_completed', today));

  if (questCompleted) {
    await awardPoints('quest_completed', today);
  }

  useQuestStore.setState({ justCompleted: questCompleted });
  await refreshDay(timezone);

  return {
    questCompleted,
    streakMilestone,
  };
}

/**
 * Guarded per day, so logging a second meal on the day you reach 7 does not
 * pay the bonus twice. Rebuilding to 7 after a break lands on a different day
 * and is worth celebrating again.
 */
async function awardStreakMilestone(timezone: string, today: LocalDate): Promise<boolean> {
  const [loggedDates, freezeDates] = await Promise.all([
    getLoggedDates(),
    getConsumedFreezeDates(),
  ]);

  // Midday: the at-risk flag is irrelevant here, only the count is read.
  const { count } = deriveStreak(loggedDates, freezeDates, today, 12);

  if (!isStreakMilestone(count)) return false;
  if (await hasAwarded('streak_milestone', today)) return false;

  await awardPoints('streak_milestone', today);
  return true;
}

/** After an edit or delete: no new points, but the quest bar must walk back. */
export async function recordChange(
  timezone: string,
): Promise<void> {
  await syncQuest(timezone);
  await refreshDay(timezone);
}
