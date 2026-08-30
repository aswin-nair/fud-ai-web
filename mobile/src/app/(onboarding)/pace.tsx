import { router } from 'expo-router';
import { View } from 'react-native';

import { OptionList } from '@/components/primitives/OptionList';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';
import type { LoggingCommitment } from '@/state/types';

const OPTIONS = [
  { value: 'light', label: 'Light — one log makes the day' },
  { value: 'regular', label: 'Regular — breakfast, lunch, dinner' },
  { value: 'detailed', label: 'Detailed — meals plus a note or photo' },
] as const;

export default function Pace() {
  const theme = useTheme();
  const draft = useOnboardingStore();

  return (
    <Screen>
      <ScreenHeader progress={0.85} title="Your pace" />
      <View style={{ gap: theme.space.lg, padding: theme.space.lg }}>
        <Text color="textSecondary">This only changes the Day ring. It never changes calorie targets.</Text>
        <OptionList
          onChange={(value) => draft.set({ loggingCommitment: value as LoggingCommitment })}
          options={[...OPTIONS]}
          value={draft.loggingCommitment}
        />
        <PressableButton
          fullWidth
          label="Continue"
          onPress={() => router.push('/(onboarding)/review')}
        />
      </View>
    </Screen>
  );
}
