import { create } from 'zustand';

import {
  getEntriesForDate,
  getLoggedDates,
  getTotalsForDate,
} from '@/db/queries/entries';
import { getConsumedFreezeDates } from '@/db/queries/freezes';
import { awardPoints, hasAwarded } from '@/db/queries/points';
import { getOrCreateQuest, setQuestProgress, specOf } from '@/db/queries/quests';
import { localHourIn, toLocalDate } from '@/logic/dates';
import { isComplete, questProgress, questTitle, type QuestSpec } from '@/logic/quests';
import { deriveStreak } from '@/logic/streak';

type QuestState = {
  spec: QuestSpec | null;
  title: string;
  progress: number;
  complete: boolean;
  /** Set for one render after completion so Home can fire confetti exactly once. */
  justCompleted: boolean;
  sync: (timezone: string, proteinTargetG: number) => Promise<void>;
  clearCelebration: () => void;
};

export const useQuestStore = create<QuestState>((set) => ({
  spec: null,
  title: '',
  progress: 0,
  complete: false,
  justCompleted: false,

  /**
   * Recomputes today's quest from the day's entries. Called after every write
   * rather than incremented in place, so deleting an entry walks the bar back.
   */
  sync: async (timezone, proteinTargetG) => {
    const today = toLocalDate(new Date(), timezone);

    const row = await getOrCreateQuest(today);
    const spec = specOf(row);

    const [entries, totals, loggedDates, freezeDates] = await Promise.all([
      getEntriesForDate(today),
      getTotalsForDate(today),
      getLoggedDates(),
      getConsumedFreezeDates(),
    ]);

    const streak = deriveStreak(loggedDates, freezeDates, today, localHourIn(timezone));

    const progress = questProgress(spec, {
      entriesToday: entries.map((e) => ({
        mealSlot: e.mealSlot,
        loggedLocalHour: localHourIn(timezone, new Date(e.loggedAtUtc)),
      })),
      proteinG: totals.proteinG,
      proteinTargetG,
      streakCount: streak.count,
    });

    const complete = isComplete(spec, progress);
    const { newlyCompleted } = await setQuestProgress(row.id, progress, complete);

    if (newlyCompleted && !(await hasAwarded('quest_completed', today))) {
      await awardPoints('quest_completed', today);
    }

    set({
      spec,
      title: questTitle(spec),
      progress,
      complete,
      justCompleted: newlyCompleted,
    });
  },

  clearCelebration: () => set({ justCompleted: false }),
}));

export async function syncQuest(timezone: string, proteinTargetG: number): Promise<void> {
  await useQuestStore.getState().sync(timezone, proteinTargetG);
}
