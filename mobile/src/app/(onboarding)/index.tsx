import { router } from 'expo-router';
import { View } from 'react-native';

import { Mascot } from '@/components/domain/Mascot';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { inferOnboardingStep } from '@/privacy/onboardingDraft';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';

export default function Welcome() {
  const theme = useTheme();
  const draft = useOnboardingStore();
  const step = inferOnboardingStep(draft);
  const resume = Boolean(draft.dateOfBirth || draft.name || draft.activityLevel || draft.goal);

  return (
    <Screen>
      <View
        style={{
          flex: 1,
          gap: theme.space.xl,
          justifyContent: 'center',
          padding: theme.space.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.space.lg }}>
          <Mascot size={140} state="waving" />
          <Text align="center" variant="display">
            Log one meal a day
          </Text>
          <Text align="center" color="textSecondary" variant="body">
            That is the whole habit. Everything else here exists to make that
            one action take a few seconds and feel worth repeating tomorrow.
          </Text>
        </View>

        <PressableButton
          fullWidth
          label={resume ? 'Continue setup' : 'Get started'}
          onPress={() =>
            router.push(
              step === 'activity'
                ? '/(onboarding)/activity'
                : step === 'goal'
                  ? '/(onboarding)/goal'
                  : step === 'review'
                    ? '/(onboarding)/review'
                    : '/(onboarding)/profile',
            )
          }
        />

        <Text align="center" color="textMuted" variant="caption">
          Built for adults. This is a habit tracker, not a medical tool.
        </Text>
      </View>
    </Screen>
  );
}
