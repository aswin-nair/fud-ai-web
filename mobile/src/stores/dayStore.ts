import { create } from 'zustand';

import {
  getEntriesForDate,
  getLoggedDates,
  getTotalsForDate,
  type DayTotals,
  type EntryWithFood,
} from '@/db/queries/entries';
import { getConsumedFreezeDates } from '@/db/queries/freezes';
import { getTotalPoints } from '@/db/queries/points';
import { localHourIn, toLocalDate, type LocalDate } from '@/logic/dates';
import { deriveStreak, type Streak } from '@/logic/streak';

const EMPTY_TOTALS: DayTotals = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  entryCount: 0,
};

const EMPTY_STREAK: Streak = { count: 0, loggedToday: false, atRisk: false };

type DayState = {
  selectedDate: LocalDate;
  entries: EntryWithFood[];
  totals: DayTotals;
  streak: Streak;
  points: number;
  loading: boolean;
  selectDate: (date: LocalDate, timezone: string) => Promise<void>;
  refresh: (timezone: string) => Promise<void>;
};

export const useDayStore = create<DayState>((set, get) => ({
  selectedDate: toLocalDate(new Date(), 'UTC'),
  entries: [],
  totals: EMPTY_TOTALS,
  streak: EMPTY_STREAK,
  points: 0,
  loading: true,

  selectDate: async (date, timezone) => {
    set({ selectedDate: date });
    await get().refresh(timezone);
  },

  /**
   * Reads everything Home needs in one pass. The streak is recomputed here
   * rather than cached, so a write anywhere in the app is reflected as soon as
   * this runs — there is no counter to keep in sync.
   */
  refresh: async (timezone) => {
    const date = get().selectedDate;

    const [entries, totals, loggedDates, freezeDates, points] = await Promise.all([
      getEntriesForDate(date),
      getTotalsForDate(date),
      getLoggedDates(),
      getConsumedFreezeDates(),
      getTotalPoints(),
    ]);

    const today = toLocalDate(new Date(), timezone);

    set({
      entries,
      totals,
      points,
      streak: deriveStreak(loggedDates, freezeDates, today, localHourIn(timezone)),
      loading: false,
    });
  },
}));

/** Call after any write so Home, History and the badges all re-read together. */
export async function refreshDay(timezone: string): Promise<void> {
  await useDayStore.getState().refresh(timezone);
}
