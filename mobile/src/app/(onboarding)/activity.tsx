import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { OptionList } from '@/components/primitives/OptionList';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { type ActivityLevel } from '@/db/schema';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';

const OPTIONS = [
  {
    value: 'sedentary',
    label: 'Mostly sitting',
    detail: 'Desk job, little deliberate exercise',
  },
  { value: 'light', label: 'Lightly active', detail: 'Light exercise one to three days a week' },
  { value: 'moderate', label: 'Moderately active', detail: 'Exercise three to five days a week' },
  { value: 'active', label: 'Very active', detail: 'Hard exercise six or seven days a week' },
  {
    value: 'veryActive',
    label: 'Extremely active',
    detail: 'Physical job, or training twice a day',
  },
] as const satisfies readonly { value: ActivityLevel; label: string; detail: string }[];

export default function ActivityStep() {
  const theme = useTheme();
  const { activityLevel, set } = useOnboardingStore();

  return (
    <Screen>
      <ScreenHeader progress={0.5} title="How you move" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <Text color="textSecondary" variant="body">
          A rough answer is fine. You can change it later, and the app adjusts
          as you log.
        </Text>

        <OptionList
          onChange={(value) => set({ activityLevel: value })}
          options={OPTIONS}
          value={activityLevel}
        />

        <PressableButton
          disabled={activityLevel === null}
          fullWidth
          label="Continue"
          onPress={() => router.push('/(onboarding)/goal')}
        />
      </ScrollView>
    </Screen>
  );
}
