import { Redirect } from 'expo-router';

import { useProfileStore } from '@/stores/profileStore';

/**
 * Entry gate. The profile row is created at the end of onboarding, so its
 * absence is what marks a first run — there is no separate flag to fall out
 * of sync with it.
 */
export default function Index() {
  const profile = useProfileStore((s) => s.profile);

  return <Redirect href={profile ? '/(tabs)' : '/(onboarding)'} />;
}
