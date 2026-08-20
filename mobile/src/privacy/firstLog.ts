import { recordFirstLogEvent } from '@/db/queries/localPrivacy'
import { clearPersistedOnboardingDraft } from '@/privacy/onboardingDraftStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useProfileStore } from '@/stores/profileStore'

/** Marks the first accepted meal and drops the onboarding draft. Safe to call after every log. */
export async function completeFirstLogIfNeeded(): Promise<boolean> {
  const first = await recordFirstLogEvent()
  if (!first) return false

  await clearPersistedOnboardingDraft()
  useOnboardingStore.getState().reset()
  useProfileStore.setState({ firstLogRecorded: true })
  return true
}
