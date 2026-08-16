import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Stepper } from '@/components/primitives/Stepper';
import { Text } from '@/components/primitives/Text';
import { deleteEntry, getEntry, updateEntry } from '@/db/queries/entries';
import { type MealEntry, type MealSlot } from '@/db/schema';
import { MEAL_SLOT_LABEL, MEAL_SLOTS } from '@/logic/mealSlot';
import { useProfileStore } from '@/stores/profileStore';
import { recordChange } from '@/stores/progression';
import { useTheme } from '@/theme/useTheme';

export default function EditEntry() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const timezone = useProfileStore((s) => s.timezone)();

  const [entry, setEntry] = useState<MealEntry | null>(null);
  const [servings, setServings] = useState(1);
  const [slot, setSlot] = useState<MealSlot>('snack');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getEntry(Number(id))
      .then((row) => {
        if (!row) return;
        setEntry(row);
        setServings(row.servings);
        setSlot(row.mealSlot);
      })
      .catch(() => undefined);
  }, [id]);

  if (!entry) return <Screen />;

  // Stored values are for the servings recorded, so scale back to one first.
  const perServing = {
    kcal: entry.kcal / entry.servings,
    proteinG: entry.proteinG / entry.servings,
    carbsG: entry.carbsG / entry.servings,
    fatG: entry.fatG / entry.servings,
  };

  const preview = {
    kcal: perServing.kcal * servings,
    proteinG: perServing.proteinG * servings,
    carbsG: perServing.carbsG * servings,
    fatG: perServing.fatG * servings,
  };

  async function save() {
    setSaving(true);

    try {
      await updateEntry(Number(id), {
        servings,
        mealSlot: slot,
        kcal: preview.kcal,
        proteinG: preview.proteinG,
        carbsG: preview.carbsG,
        fatG: preview.fatG,
      });

      await recordChange(timezone);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this entry?', 'It will be removed from your log.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteEntry(Number(id));
            await recordChange(timezone);
            router.back();
          })();
        },
      },
    ]);
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={entry.customName ?? 'Edit entry'} />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <Stepper onChange={setServings} unit="servings" value={servings} />

        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          {MEAL_SLOTS.map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: option === slot }}
              key={option}
              onPress={() => setSlot(option)}
              style={{
                backgroundColor:
                  option === slot ? theme.colors.onTrack : theme.colors.surface,
                borderColor: option === slot ? theme.colors.onTrack : theme.colors.border,
                borderRadius: theme.radius.pill,
                borderWidth: 1,
                flex: 1,
                paddingVertical: theme.space.sm,
              }}
            >
              <Text
                align="center"
                color={option === slot ? 'textOnFill' : 'textSecondary'}
                variant="caption"
              >
                {MEAL_SLOT_LABEL[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: theme.space.sm }}>
            <Text variant="display">{Math.round(preview.kcal)}</Text>
            <Text color="textMuted" variant="label">
              kcal
            </Text>
          </View>
        </Card>

        <PressableButton fullWidth label="Save changes" loading={saving} onPress={() => void save()} />
        <PressableButton
          fullWidth
          label="Delete entry"
          onPress={confirmDelete}
          variant="destructive"
        />
      </ScrollView>
    </Screen>
  );
}
