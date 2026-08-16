import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { OptionList } from '@/components/primitives/OptionList';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { type Sex } from '@/db/schema';
import { buildLocalDate } from '@/logic/dates';
import { ageOn } from '@/logic/nutrition';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';

const MINIMUM_AGE = 18;

const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
] as const satisfies readonly { value: Sex; label: string }[];

export default function ProfileStep() {
  const theme = useTheme();
  const draft = useOnboardingStore();

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [dobError, setDobError] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(draft.dateOfBirth !== null);

  const [name, setName] = useState(draft.name);
  const [sex, setSex] = useState<Sex | null>(draft.sex);
  const [height, setHeight] = useState(draft.heightCm ? String(draft.heightCm) : '');
  const [weight, setWeight] = useState(draft.weightKg ? String(draft.weightKg) : '');

  /**
   * Runs the age gate the moment a complete date of birth exists, before any
   * other question is even rendered. §2.2 forbids collecting height and weight
   * from a minor and only then refusing.
   */
  function checkAge() {
    const dob = buildLocalDate(Number(year), Number(month), Number(day));

    if (!dob) {
      setDobError('That is not a date we recognise. Check the day, month and year.');
      return;
    }

    const age = ageOn(dob);

    if (age > 130 || age < 0) {
      setDobError('Check the year — that date does not look right.');
      return;
    }

    if (age < MINIMUM_AGE) {
      setDobError(null);
      // replace, not push: there must be no back gesture into the flow.
      router.replace('/(onboarding)/blocked');
      return;
    }

    setDobError(null);
    draft.set({ dateOfBirth: dob });
    setAgeConfirmed(true);
  }

  const dobComplete = day.length > 0 && month.length > 0 && year.length === 4;

  const canContinue =
    ageConfirmed &&
    sex !== null &&
    Number(height) > 0 &&
    Number(weight) > 0 &&
    name.trim().length > 0;

  function next() {
    draft.set({
      name: name.trim(),
      sex,
      heightCm: Number(height),
      weightKg: Number(weight),
    });
    router.push('/(onboarding)/activity');
  }

  return (
    <Screen>
      <ScreenHeader progress={0.25} title="About you" />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: theme.space.md }}>
          <Text variant="subtitle">Date of birth</Text>
          <Text color="textSecondary" variant="caption">
            We ask first because this app is built for adults only.
          </Text>

          <View style={{ flexDirection: 'row', gap: theme.space.md }}>
            <View style={{ flex: 1 }}>
              <TextField
                editable={!ageConfirmed}
                keyboardType="number-pad"
                label="Day"
                maxLength={2}
                onChangeText={setDay}
                placeholder="DD"
                value={day}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                editable={!ageConfirmed}
                keyboardType="number-pad"
                label="Month"
                maxLength={2}
                onChangeText={setMonth}
                placeholder="MM"
                value={month}
              />
            </View>
            <View style={{ flex: 1.3 }}>
              <TextField
                editable={!ageConfirmed}
                keyboardType="number-pad"
                label="Year"
                maxLength={4}
                onChangeText={setYear}
                placeholder="YYYY"
                value={year}
              />
            </View>
          </View>

          {dobError ? (
            <Text color="textSecondary" variant="label">
              {dobError}
            </Text>
          ) : null}

          {!ageConfirmed ? (
            <PressableButton
              disabled={!dobComplete}
              fullWidth
              label="Continue"
              onPress={checkAge}
              variant="secondary"
            />
          ) : null}
        </View>

        {ageConfirmed ? (
          <>
            <TextField
              autoCapitalize="words"
              label="What should we call you?"
              onChangeText={setName}
              placeholder="Your name"
              value={name}
            />

            <View style={{ gap: theme.space.md }}>
              <Text variant="subtitle">Sex</Text>
              <Text color="textSecondary" variant="caption">
                Used only for the calorie formula, which differs by sex.
              </Text>
              <OptionList onChange={setSex} options={SEX_OPTIONS} value={sex} />
            </View>

            <View style={{ flexDirection: 'row', gap: theme.space.md }}>
              <View style={{ flex: 1 }}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Height"
                  onChangeText={setHeight}
                  placeholder="175"
                  suffix="cm"
                  value={height}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Weight"
                  onChangeText={setWeight}
                  placeholder="70"
                  suffix="kg"
                  value={weight}
                />
              </View>
            </View>

            <PressableButton
              disabled={!canContinue}
              fullWidth
              label="Continue"
              onPress={next}
            />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
