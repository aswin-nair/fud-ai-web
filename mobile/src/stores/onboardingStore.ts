import { create } from 'zustand';

import { type ActivityLevel, type Goal, type Sex } from '@/db/schema';

export type OnboardingDraft = {
  name: string;
  dateOfBirth: string | null; // 'YYYY-MM-DD'
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  weeklyRatePct: number;
  goalWeightKg: number | null;
};

const EMPTY: OnboardingDraft = {
  name: '',
  dateOfBirth: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  goal: null,
  weeklyRatePct: 0.5,
  goalWeightKg: null,
};

type OnboardingState = OnboardingDraft & {
  set: (values: Partial<OnboardingDraft>) => void;
  reset: () => void;
};

/** Held in memory only; nothing is written until review.tsx is confirmed. */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...EMPTY,
  set: (values) => set(values),
  reset: () => set(EMPTY),
}));
