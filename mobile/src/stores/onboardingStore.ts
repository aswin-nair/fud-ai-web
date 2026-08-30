import { create } from 'zustand';

import { type ActivityLevel, type Goal, type Sex } from '@/db/schema';
import type { LoggingCommitment } from '@/state/types';

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
  loggingCommitment: LoggingCommitment;
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
  loggingCommitment: 'light',
};

type OnboardingState = OnboardingDraft & {
  set: (values: Partial<OnboardingDraft>) => void;
  reset: () => void;
};

/** Memory copy of the SQLite onboarding draft. Persist via onboardingDraftStore. */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...EMPTY,
  set: (values) => set(values),
  reset: () => set(EMPTY),
}));
