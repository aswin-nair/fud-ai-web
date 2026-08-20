import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { Screen } from '@/components/primitives/Screen';
import { SettingRow } from '@/components/primitives/SettingRow';
import { Text } from '@/components/primitives/Text';
import { getLoggedDates } from '@/db/queries/entries';
import { countAvailableFreezes } from '@/db/queries/freezes';
import { levelFor } from '@/logic/points';
import { shareReadableExport } from '@/privacy/localData';
import { refreshDay, useDayStore } from '@/stores/dayStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

export default function ProfileTab() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const update = useProfileStore((s) => s.update);
  const timezone = useProfileStore((s) => s.timezone)();
  const { streak, points } = useDayStore();

  const [totalLogs, setTotalLogs] = useState(0);
  const [freezes, setFreezes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void refreshDay(timezone);
      void getLoggedDates()
        .then((dates) => setTotalLogs(dates.length))
        .catch(() => undefined);
      void countAvailableFreezes()
        .then(setFreezes)
        .catch(() => undefined);
    }, [timezone]),
  );

  async function exportData() {
    const result = await shareReadableExport();
    if (!result.ok) {
      Alert.alert('Export could not finish', result.error);
      return;
    }
    if (!result.shared) {
      Alert.alert(
        'Export saved',
        'Sharing is not available on this device. The JSON file is in the app cache.',
      );
    }
  }

  if (!profile) return null;

  const level = levelFor(points);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          paddingBottom: theme.space.xxl,
          paddingTop: theme.space.lg,
        }}
      >
        <View style={{ gap: theme.space.md, paddingHorizontal: theme.space.lg }}>
          <Text variant="title">Hey {profile.name}</Text>

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stat label="Day streak" value={String(streak.count)} />
              <Stat label="Days logged" value={String(totalLogs)} />
              <Stat label="Level" value={String(level.level)} />
            </View>
          </Card>

          <Text color="textMuted" variant="caption">
            {freezes === 1
              ? '1 streak freeze available. It applies itself if you miss a day.'
              : `${freezes} streak freezes available. They apply themselves if you miss a day.`}
          </Text>
        </View>

        <Section title="Your goal">
          <SettingRow
            kind="value"
            label="Daily target"
            value={`${profile.dailyKcalTarget} kcal`}
          />
          <SettingRow kind="value" label="Protein" value={`${profile.proteinGTarget} g`} />
          <SettingRow kind="value" label="Carbs" value={`${profile.carbsGTarget} g`} />
          <SettingRow kind="value" label="Fat" value={`${profile.fatGTarget} g`} />
        </Section>

        <Section title="Feel">
          <SettingRow
            kind="toggle"
            label="Sound"
            onValueChange={(value) => void update({ soundEnabled: value })}
            value={profile.soundEnabled}
          />
          <SettingRow
            kind="toggle"
            label="Haptics"
            onValueChange={(value) => void update({ hapticsEnabled: value })}
            value={profile.hapticsEnabled}
          />
        </Section>

        <Section title="Privacy">
          <SettingRow
            detail="Sign in, recover a password, or delete the cloud account. Local meals stay on this device."
            kind="navigate"
            label="Account"
            onPress={() => router.push('/settings/account' as Href)}
          />
          <SettingRow
            detail="Optionally ask for device authentication after launch and when returning to the app."
            kind="navigate"
            label="App lock"
            onPress={() => router.push('/settings/app-lock' as Href)}
          />
        </Section>

        {/* Pause and Support are ordinary visible rows, not buried. §2.8. */}
        <Section title="Taking a break">
          <SettingRow
            detail={
              profile.trackingPaused
                ? 'Calorie, macro, and weight numbers are hidden and your streak is held.'
                : 'Hide calorie, macro, and weight numbers and hold your streak where it is.'
            }
            kind="navigate"
            label="Pause tracking"
            onPress={() => router.push('/settings/pause')}
          />
          <SettingRow
            detail="Helplines and support, if food or your body is feeling heavy."
            kind="navigate"
            label="Support"
            onPress={() => router.push('/settings/support')}
          />
        </Section>

        <Section title="Your data">
          <SettingRow
            detail="A readable JSON copy of your profile, meals, and settings. Keys and app lock are left out."
            kind="navigate"
            label="Export data"
            onPress={() => void exportData()}
          />
          <SettingRow
            detail="Removes every local store on this device. Type DELETE to confirm."
            kind="navigate"
            label="Delete all data"
            onPress={() => router.push('/settings/delete-data' as Href)}
            tone="danger"
          />
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text
        color="textSecondary"
        style={{ paddingHorizontal: theme.space.lg }}
        variant="label"
      >
        {title}
      </Text>
      <View style={{ backgroundColor: theme.colors.surface }}>{children}</View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 2 }}>
      <Text variant="display">{value}</Text>
      <Text color="textMuted" variant="caption">
        {label}
      </Text>
    </View>
  );
}
