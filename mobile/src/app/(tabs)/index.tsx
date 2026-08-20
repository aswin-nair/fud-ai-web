import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';

import { CalorieRing } from '@/components/domain/CalorieRing';
import { MacroGroup } from '@/components/domain/MacroGroup';
import { Mascot } from '@/components/domain/Mascot';
import { MealRow } from '@/components/domain/MealRow';
import { QuestCard } from '@/components/domain/QuestCard';
import { StreakBadge } from '@/components/domain/StreakBadge';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { deleteEntry, type EntryWithFood } from '@/db/queries/entries';
import { type MealSlot } from '@/db/schema';
import { MEAL_SLOT_LABEL, MEAL_SLOTS } from '@/logic/mealSlot';
import { levelFor } from '@/logic/points';
import { useDayStore } from '@/stores/dayStore';
import { useFeedbackStore } from '@/stores/feedbackStore';
import { useLogStore } from '@/stores/logStore';
import { useProfileStore } from '@/stores/profileStore';
import { openSession, recordChange } from '@/stores/progression';
import { useQuestStore } from '@/stores/questStore';
import { useTheme } from '@/theme/useTheme';
import { type QuestType } from '@/logic/quests';
import { type IconName } from '@/components/icons/Icon';

const QUEST_ICON: Record<QuestType, IconName> = {
  log_n_meals: 'plus',
  log_before: 'history',
  log_streak: 'flame',
};

export default function Home() {
  const theme = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const timezone = useProfileStore((s) => s.timezone)();
  const { entries, totals, streak, points } = useDayStore();
  const beginLog = useLogStore((s) => s.begin);
  const quest = useQuestStore();
  // True for a couple of seconds after a log lands. §11.1.
  const happy = useFeedbackStore((s) => s.happy);

  useFocusEffect(
    useCallback(() => {
      // The freeze must be applied before anything reads the streak, or a user
      // whose freeze covered yesterday sees a zero flash before it is rescued.
      void openSession(timezone).then(() => recordChange(timezone));
    }, [timezone]),
  );

  if (!profile) return null;

  const paused = profile.trackingPaused;
  const level = levelFor(points);

  function openLog() {
    beginLog();
    router.push('/log');
  }

  async function remove(id: number) {
    await deleteEntry(id);
    await recordChange(timezone);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl * 3,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            gap: theme.space.sm,
            justifyContent: 'space-between',
          }}
        >
          <StreakBadge atRisk={streak.atRisk} count={streak.count} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="label">{points} pts</Text>
            <Text color="textMuted" variant="caption">
              Level {level.level}
            </Text>
          </View>
        </View>

        {paused ? (
          <PausedCard />
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: theme.space.sm }}>
              <View>
                <CalorieRing
                  consumed={totals.kcal}
                  size={180}
                  target={profile.dailyKcalTarget}
                />
                {/* Absolutely placed so appearing and leaving never reflows the
                    ring — the ring is mid-animation at exactly this moment. */}
                {happy ? (
                  <View
                    pointerEvents="none"
                    style={{
                      bottom: 0,
                      position: 'absolute',
                      right: -theme.space.xxl,
                    }}
                  >
                    <Mascot size={64} state="happy" />
                  </View>
                ) : null}
              </View>
              <Text color="textMuted" variant="label">
                {Math.round(totals.kcal)} of {profile.dailyKcalTarget} today
              </Text>
            </View>

            <Card>
              <MacroGroup
                consumed={{
                  protein: totals.proteinG,
                  carbs: totals.carbsG,
                  fat: totals.fatG,
                }}
                target={{
                  protein: profile.proteinGTarget,
                  carbs: profile.carbsGTarget,
                  fat: profile.fatGTarget,
                }}
              />
            </Card>

            {quest.spec ? (
              <QuestCard
                current={quest.progress}
                goal={quest.spec.target}
                icon={QUEST_ICON[quest.spec.type]}
                title={quest.title}
              />
            ) : null}
          </>
        )}

        {entries.length === 0 ? (
          <EmptyToday onLog={openLog} />
        ) : (
          MEAL_SLOTS.map((slot) => (
            <SlotSection
              entries={entries.filter((entry) => entry.mealSlot === slot)}
              key={slot}
              onDelete={(id) => void remove(id)}
              onEdit={(id) => router.push(`/entry/${id}`)}
              slot={slot}
            />
          ))
        )}
      </ScrollView>

      <View
        style={{
          bottom: theme.space.xl,
          left: theme.space.lg,
          position: 'absolute',
          right: theme.space.lg,
        }}
      >
        <PressableButton fullWidth label="Log a meal" onPress={openLog} />
      </View>
    </Screen>
  );
}

function SlotSection({
  slot,
  entries,
  onEdit,
  onDelete,
}: {
  slot: MealSlot;
  entries: EntryWithFood[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const theme = useTheme();
  if (entries.length === 0) return null;

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text color="textSecondary" variant="label">
        {MEAL_SLOT_LABEL[slot]}
      </Text>
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {entries.map((entry) => (
          <MealRow
            calories={entry.kcal}
            key={entry.id}
            macros={{
              protein: entry.proteinG,
              carbs: entry.carbsG,
              fat: entry.fatG,
            }}
            name={entry.foodName ?? entry.customName ?? 'Entry'}
            onDelete={() => onDelete(entry.id)}
            onEdit={() => onEdit(entry.id)}
            portion={`${formatServings(entry.servings)}×`}
          />
        ))}
      </Card>
    </View>
  );
}

/** An invitation, not an apology: names the space and offers one action. */
function EmptyToday({ onLog }: { onLog: () => void }) {
  const theme = useTheme();

  return (
    <Card style={{ alignItems: 'center', gap: theme.space.md }}>
      <Mascot size={96} state="idle" />
      <Text align="center" variant="subtitle">
        Today is a blank page
      </Text>
      <Text align="center" color="textSecondary" variant="body">
        Log anything at all and the day counts.
      </Text>
      <PressableButton label="Log a meal" onPress={onLog} variant="secondary" />
    </Card>
  );
}

function PausedCard() {
  const theme = useTheme();

  return (
    <Card tint="onTrack" style={{ alignItems: 'center', gap: theme.space.md }}>
      <Mascot size={96} state="sleeping" />
      <Text align="center" variant="subtitle">
        Tracking is paused
      </Text>
      <Text align="center" color="textSecondary" variant="body">
        Calorie and macro numbers are hidden and your streak is held where it
        is. Turn tracking back on in settings whenever you want to.
      </Text>
    </Card>
  );
}

function formatServings(servings: number): string {
  return Number.isInteger(servings) ? String(servings) : servings.toFixed(1);
}
