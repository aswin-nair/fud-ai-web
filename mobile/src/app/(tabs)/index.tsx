import { dayRingProgress, localDayKey } from '@fud-ai/product'
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { CalorieRing } from '@/components/domain/CalorieRing';
import { MomoOverlay } from '@/components/momo/MomoOverlay';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { DayRing } from '@/components/today/DayRing';
import { confirm as hapticConfirm } from '@/feel/haptics';
import { play } from '@/feel/sound';
import { ageOn, computeTargets } from '@/logic/nutrition';
import { useApp } from '@/state/AppProvider';
import { entriesForDay, loggingStreak, macroTotals } from '@/state/journey';
import { useTheme } from '@/theme/useTheme';

export default function Today() {
  const theme = useTheme();
  const { state, guest, importNotice, dismissImportNotice, setWater, addNote } = useApp();
  const today = new Date();
  const dayKey = localDayKey(today);
  const dayEntries = entriesForDay(state.foodEntries, today);
  const totals = macroTotals(dayEntries);
  const streak = loggingStreak(state.foodEntries, state.gamification);
  const notes = state.gamification.notesByDate[dayKey] ?? 0;
  const water = state.gamification.waterByDate[dayKey] ?? 0;
  const ring = dayRingProgress(dayEntries, notes, state.profile.loggingCommitment ?? 'light');
  const paused = Boolean(state.profile.trackingPaused);
  const targets = computeTargets({
    sex: state.profile.gender === 'male' ? 'male' : 'female',
    ageYears: ageOn(state.profile.birthday),
    heightCm: state.profile.heightCm,
    weightKg: state.profile.weightKg,
    activityLevel: state.profile.activityLevel === 'extraActive' ? 'veryActive' : state.profile.activityLevel,
    goal: state.profile.goal,
    weeklyRatePct: state.profile.weeklyChangeKg ?? 0.5,
  });
  const calorieTarget = targets.ok ? targets.targets.dailyKcalTarget : 2000;
  const proteinGoal = targets.ok ? targets.targets.proteinGTarget : 100;
  const carbsGoal = targets.ok ? targets.targets.carbsGTarget : 200;
  const fatGoal = targets.ok ? targets.targets.fatGTarget : 70;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.space.lg, padding: theme.space.lg, paddingBottom: 140 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="title">Today</Text>
          <Text color="onTrack" variant="subtitle">{streak} day streak · Lv {state.gamification.level}</Text>
        </View>

        {importNotice ? (
          <Card>
            <Text variant="body">{importNotice}</Text>
            <PressableButton label="Got it" onPress={dismissImportNotice} />
          </Card>
        ) : null}

        {guest ? (
          <Card>
            <Text variant="subtitle">Save your progress</Text>
            <Text color="textSecondary" variant="body">Create an account to keep this device log and sync it with the web app.</Text>
            <PressableButton label="Save progress" onPress={() => router.push('/login?claim=1' as never)} />
          </Card>
        ) : null}

        {paused ? (
          <Card>
            <Text variant="subtitle">Tracking is paused</Text>
            <Text color="textSecondary">Numbers are hidden. Your streak is held.</Text>
          </Card>
        ) : (
          <>
            <DayRing progress={ring} />
            <Pressable onPress={() => guest ? router.push('/login?claim=1' as never) : router.push('/log')}>
              <CalorieRing consumed={totals.calories} target={calorieTarget} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <MacroChip label="Protein" current={totals.protein} goal={proteinGoal} color="protein" />
              <MacroChip label="Carbs" current={totals.carbs} goal={carbsGoal} color="carbs" />
              <MacroChip label="Fat" current={totals.fat} goal={fatGoal} color="fat" />
            </View>
            <Card>
              <Text variant="subtitle">Water</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setWater(dayKey, i + 1 === water ? i : i + 1)}
                    style={{
                      backgroundColor: i < water ? theme.colors.protein : theme.colors.track,
                      borderRadius: 16,
                      height: 32,
                      width: 32,
                    }}
                  />
                ))}
              </View>
              <PressableButton
                label="Kitchen note"
                onPress={() => addNote(dayKey)}
                variant="secondary"
              />
            </Card>
            <View style={{ gap: theme.space.sm }}>
              <Text variant="subtitle">Logged</Text>
              {dayEntries.length === 0 ? (
                <Text color="textSecondary">Nothing logged yet — start with breakfast.</Text>
              ) : dayEntries.map(entry => (
                <Pressable key={entry.id} onPress={() => router.push(`/entry/${entry.id}`)}>
                  <Card>
                    <Text variant="body">{entry.name}</Text>
                    <Text color="textSecondary" variant="caption">{Math.round(entry.calories)} kcal</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {!guest ? (
          <PressableButton
            fullWidth
            label="Log a meal"
            onPress={() => {
              void hapticConfirm();
              play('logConfirm');
              router.push('/log');
            }}
          />
        ) : null}
      </ScrollView>
      <MomoOverlay />
    </Screen>
  );
}

function MacroChip({
  label,
  current,
  goal,
  color,
}: {
  label: string
  current: number
  goal: number
  color: 'protein' | 'carbs' | 'fat'
}) {
  const theme = useTheme();
  const pct = goal > 0 ? Math.min(1, current / goal) : 0;
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 16, flex: 1, padding: 10 }}>
      <Text variant="caption">{label}</Text>
      <View style={{ backgroundColor: theme.colors.track, borderRadius: 99, height: 6, marginVertical: 6 }}>
        <View style={{ backgroundColor: theme.colors[color], borderRadius: 99, height: 6, width: `${pct * 100}%` }} />
      </View>
      <Text variant="caption">{Math.round(current)} / {goal}</Text>
    </View>
  );
}
