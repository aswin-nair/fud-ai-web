import { Redirect } from 'expo-router';

import { useApp } from '@/state/AppProvider';

export default function Index() {
  const { ready, state } = useApp();
  if (!ready) return null;
  if (!state.onboarded && state.foodEntries.length === 0) {
    return <Redirect href="/(onboarding)" />;
  }
  return <Redirect href="/(tabs)" />;
}
