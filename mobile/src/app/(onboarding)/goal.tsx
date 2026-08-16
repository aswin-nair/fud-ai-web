import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { OptionList } from '@/components/primitives/OptionList';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { type Goal } from '@/db/schema';
import { computeBmi, MAX_WEEKLY_RATE_PCT, MIN_BMI, minimumHealthyWeightKg } from '@/logic/nutrition';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';

const GOALS = [
  { value: 'lose', label: 'Lose weight', detail: 'A steady deficit, capped for safety' },
  { value: 'maintain', label: 'Stay where I am', detail: 'Eat around maintenance' },
  { value: 'gain', label: 'Gain weight', detail: 'A small surplus' },
] as const satisfies readonly { value: Goal; label: string; detail: string }[];

/** Capped at 1% of bodyweight per week, per §2.1. */
const RATES = [
  { value: '0.25', label: 'Gently', detail: '0.25% of bodyweight a week' },
  { value: '0.5', label: 'Steady', detail: '0.5% of bodyweight a week' },
  { value: '0.75', label: 'Faster', detail: '0.75% of bodyweight a week' },
  { value: '1', label: 'Fastest we support', detail: '1% of bodyweight a week' },
] as const;

export default function GoalStep() {
  const theme = useTheme();
  const draft = useOnboardingStore();

  const [goalWeight, setGoalWeight] = useState(
    draft.goalWeightKg ? String(draft.goalWeightKg) : '',
  );

  const heightCm = draft.heightCm ?? 0;
  const entered = Number(goalWeight);
  const hasGoalWeight = goalWeight.trim().length > 0 && entered > 0;

  const goalWeightTooLow =
    hasGoalWeight && heightCm > 0 && computeBmi(entered, heightCm) < MIN_BMI;

  const needsRate = draft.goal === 'lose' || draft.goal === 'gain';
  const canContinue = draft.goal !== null && !goalWeightTooLow;

  function next() {
    draft.set({
      goalWeightKg: hasGoalWeight ? entered : null,
      weeklyRatePct: draft.goal === 'maintain' ? 0 : draft.weeklyRatePct,
    });
    router.push('/(onboarding)/review');
  }

  return (
    <Screen>
      <ScreenHeader progress={0.75} title="Your goal" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <OptionList
          onChange={(value) => draft.set({ goal: value })}
          options={GOALS}
          value={draft.goal}
        />

        {needsRate ? (
          <View style={{ gap: theme.space.md }}>
            <Text variant="subtitle">How quickly?</Text>
            <Text color="textSecondary" variant="caption">
              We cap this at {MAX_WEEKLY_RATE_PCT}% of bodyweight a week. Faster
              than that costs muscle and is harder to stick to.
            </Text>
            <OptionList
              onChange={(value) => draft.set({ weeklyRatePct: Number(value) })}
              options={RATES}
              value={String(draft.weeklyRatePct) as (typeof RATES)[number]['value']}
            />
          </View>
        ) : null}

        <View style={{ gap: theme.space.md }}>
          <TextField
            hint="Optional. Leave blank if you would rather not set one."
            keyboardType="decimal-pad"
            label="Goal weight"
            onChangeText={setGoalWeight}
            placeholder={draft.weightKg ? String(draft.weightKg) : '70'}
            suffix="kg"
            value={goalWeight}
          />

          {goalWeightTooLow ? (
            <Card>
              <Text variant="subtitle">We cannot set that as a goal</Text>
              <Text
                color="textSecondary"
                style={{ marginTop: theme.space.sm }}
                variant="body"
              >
                {entered} kg puts you at a BMI of{' '}
                {computeBmi(entered, heightCm).toFixed(1)}, below the healthy
                range. For your height the lowest we support is{' '}
                {minimumHealthyWeightKg(heightCm).toFixed(1)} kg. If you want to
                go below that, please talk to a doctor first.
              </Text>
            </Card>
          ) : null}
        </View>

        <PressableButton
          disabled={!canContinue}
          fullWidth
          label="See my target"
          onPress={next}
        />
      </ScrollView>
    </Screen>
  );
}
