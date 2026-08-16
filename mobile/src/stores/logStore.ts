import { create } from 'zustand';

import { type Food } from '@/db/schema';

/** Where the food came from. Feeds the meal_logged analytics event. */
export type LogSource = 'recent' | 'search' | 'quick_add';

type LogState = {
  food: Food | null;
  source: LogSource;
  /**
   * Set when the FAB is tapped. The gap between this and the write is
   * `seconds_to_log`, the leading indicator for retention per §13 — so it is
   * measured, not estimated.
   */
  startedAt: number | null;
  begin: () => void;
  pick: (food: Food, source: LogSource) => void;
  elapsedSeconds: () => number | null;
  reset: () => void;
};

export const useLogStore = create<LogState>((set, get) => ({
  food: null,
  source: 'search',
  startedAt: null,

  begin: () => set({ food: null, source: 'search', startedAt: Date.now() }),

  pick: (food, source) => set({ food, source }),

  elapsedSeconds: () => {
    const started = get().startedAt;
    return started === null ? null : (Date.now() - started) / 1000;
  },

  reset: () => set({ food: null, source: 'search', startedAt: null }),
}));
