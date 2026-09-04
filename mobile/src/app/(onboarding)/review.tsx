import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MacroGroup } from '@/components/domain/MacroGroup';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { deviceTimeZone } from '@/db/queries/profile';
import { ageOn, computeTargets } from '@/logic/nutrition';
import { pickDraftFields } from '@/privacy/onboardingDraft';
import { persistOnboardingDraft } from '@/privacy/onboardingDraftStore';
import { useApp } from '@/state/AppProvider';
import { defaultProfile } from '@/state/defaults';
import { useLogStore } from '@/stores/logStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

export default function Review() {
  const theme = useTheme();
  const draft = useOnboardingStore();
  const createProfile = useProfileStore((s) => s.create);
  const beginLog = useLogStore((s) => s.begin);
  const completeOnboarding = useApp().completeOnboarding;
  const [saving, setSaving] = useState(false);

  const result = computeTargets({
    sex: draft.sex ?? 'female',
    ageYears: draft.dateOfBirth ? ageOn(draft.dateOfBirth) : 0,
    heightCm: draft.heightCm ?? 0,
    weightKg: draft.weightKg ?? 0,
    activityLevel: draft.activityLevel ?? 'sedentary',
    goal: draft.goal ?? 'maintain',
    weeklyRatePct: draft.weeklyRatePct,
    goalWeightKg: draft.goalWeightKg ?? undefined,
  });

  if (!result.ok) {
    return (
      <Screen>
        <ScreenHeader progress={1} title="Your target" />
        <View style={{ gap: theme.space.lg, padding: theme.space.lg }}>
          <Card>
            <Text variant="subtitle">We need to adjust something first</Text>
            <Text
              color="textSecondary"
              style={{ marginTop: theme.space.sm }}
              variant="body"
            >
              {result.reason}
            </Text>
          </Card>
          <PressableButton
            fullWidth
            label="Go back"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </Screen>
    );
  }

  const targets = result.targets;

  async function finish() {
    if (draft.dateOfBirth === null || draft.sex === null) return;

    setSaving(true);

    try {
      await createProfile({
        name: draft.name || 'there',
        dateOfBirth: draft.dateOfBirth,
        sex: draft.sex,
        heightCm: draft.heightCm ?? 0,
        weightKg: draft.weightKg ?? 0,
        activityLevel: draft.activityLevel ?? 'sedentary',
        goal: draft.goal ?? 'maintain',
        weeklyRatePct: draft.weeklyRatePct,
        timezone: deviceTimeZone(),
        dailyKcalTarget: targets.dailyKcalTarget,
        proteinGTarget: targets.proteinGTarget,
        carbsGTarget: targets.carbsGTarget,
        fatGTarget: targets.fatGTarget,
      });

      completeOnboarding({
        ...defaultProfile(),
        name: draft.name || undefined,
        birthday: draft.dateOfBirth,
        gender: draft.sex === 'female' ? 'female' : 'male',
        heightCm: draft.heightCm ?? 170,
        weightKg: draft.weightKg ?? 70,
        activityLevel: draft.activityLevel ?? 'sedentary',
        goal: draft.goal ?? 'maintain',
        weeklyChangeKg: draft.weeklyRatePct,
        loggingCommitment: draft.loggingCommitment,
      });
      await persistOnboardingDraft(pickDraftFields(draft), {
        profilePresent: true,
        firstLogRecorded: false,
      });
      beginLog();
      router.replace('/log/manual' as never);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader progress={1} title="Your target" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        {/* The clamp explanation sits above the number, per §9.5, so the user
            reads why before they read what. */}
        {targets.clamped ? (
          <Card tint="onTrack">
            <Text variant="subtitle">We adjusted this a little</Text>
            <Text
              color="textSecondary"
              style={{ marginTop: theme.space.sm }}
              variant="body"
            >
              {targets.clamped}
            </Text>
          </Card>
        ) : null}

        <View style={{ alignItems: 'center', gap: theme.space.xs }}>
          <Text variant="hero">{targets.dailyKcalTarget}</Text>
          <Text color="textMuted" variant="label">
            kcal a day
          </Text>
        </View>

        <Card>
          <MacroGroup
            consumed={{ protein: 0, carbs: 0, fat: 0 }}
            target={{
              protein: targets.proteinGTarget,
              carbs: targets.carbsGTarget,
              fat: targets.fatGTarget,
            }}
          />
        </Card>

        <Card>
          <Text variant="label" color="textSecondary">
            How we got there
          </Text>
          <View style={{ gap: theme.space.sm, marginTop: theme.space.md }}>
            <Row label="At rest your body uses" value={`${targets.bmr} kcal`} />
            <Row label="With your activity level" value={`${targets.tdee} kcal`} />
            <Row label="Your daily target" value={`${targets.dailyKcalTarget} kcal`} />
          </View>
        </Card>

        <PressableButton
          fullWidth
          label="Log your first meal"
          loading={saving}
          onPress={() => void finish()}
        />

        <Text align="center" color="textMuted" variant="caption">
          You can change any of this later in settings.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text color="textSecondary" variant="body">
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}
