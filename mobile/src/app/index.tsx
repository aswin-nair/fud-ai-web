import { Redirect } from 'expo-router';

import { buildPersistedDraft, resumeHref } from '@/privacy/onboardingDraft';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useProfileStore } from '@/stores/profileStore';

/**
 * Entry gate. A profile without a first meal still needs the first-log flow.
 * An unfinished SQLite draft resumes on the step that still has work.
 */
export default function Index() {
  const profile = useProfileStore((s) => s.profile);
  const firstLogRecorded = useProfileStore((s) => s.firstLogRecorded);
  const draft = useOnboardingStore();

  const hasProgress =
    Boolean(draft.dateOfBirth) ||
    Boolean(draft.sex) ||
    Boolean(draft.name) ||
    Boolean(draft.activityLevel) ||
    Boolean(draft.goal);

  const href = resumeHref({
    profilePresent: profile !== null,
    firstLogRecorded,
    draft: hasProgress
      ? buildPersistedDraft({
          name: draft.name,
          dateOfBirth: draft.dateOfBirth,
          sex: draft.sex,
          heightCm: draft.heightCm,
          weightKg: draft.weightKg,
          activityLevel: draft.activityLevel,
          goal: draft.goal,
          weeklyRatePct: draft.weeklyRatePct,
          goalWeightKg: draft.goalWeightKg,
        })
      : null,
  });

  return <Redirect href={href} />;
}
