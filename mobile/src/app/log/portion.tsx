import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Stepper } from '@/components/primitives/Stepper';
import { Text } from '@/components/primitives/Text';
import { type MealSlot } from '@/db/schema';
import { LOG_CONFIRM, sequence } from '@/feel/motion';
import { play } from '@/feel/sound';
import { defaultMealSlot, MEAL_SLOT_LABEL, MEAL_SLOTS } from '@/logic/mealSlot';
import { useApp } from '@/state/AppProvider';
import { stampEntry } from '@/state/awards';
import { cheer } from '@/stores/feedbackStore';
import { useLogStore } from '@/stores/logStore';
import { useTheme } from '@/theme/useTheme';

export default function Portion() {
  const theme = useTheme();
  const { addEntry } = useApp();
  const food = useLogStore((s) => s.food);
  const source = useLogStore((s) => s.source);
  const reset = useLogStore((s) => s.reset);

  const [servings, setServings] = useState(1);
  const [slot, setSlot] = useState<MealSlot>(defaultMealSlot(new Date().getHours()));
  const [saving, setSaving] = useState(false);

  if (!food) {
    // Reached only if the modal is restored without a selection, e.g. after a
    // reload in development.
    return (
      <Screen>
        <ScreenHeader title="Pick a food" />
        <View style={{ padding: theme.space.lg }}>
          <PressableButton
            fullWidth
            label="Back to search"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </Screen>
    );
  }

  const preview = {
    kcal: food.kcal * servings,
    proteinG: food.proteinG * servings,
    carbsG: food.carbsG * servings,
    fatG: food.fatG * servings,
  };

  /**
   * The signature moment, §11.1. The beats are sequenced from the press, not
   * from the moment the write finishes, so a slow disk shortens the gaps rather
   * than sliding the whole thing late.
   */
  async function confirm() {
    if (!food) return;

    const pressedAt = Date.now();
    setSaving(true);

    try {
      addEntry(stampEntry({
        id: crypto.randomUUID(),
        name: food.name,
        calories: preview.kcal,
        protein: preview.proteinG,
        carbs: preview.carbsG,
        fat: preview.fatG,
        timestamp: new Date().toISOString(),
        source: source === 'recent' ? 'recent' : 'manual',
        mealType: slot,
        servingSizeGrams: food.servingGrams == null ? undefined : food.servingGrams * servings,
        detailAdded: true,
      }));
      reset();

      const since = (offset: number) => Math.max(offset - (Date.now() - pressedAt), 0);

      sequence([
        // Dismisses both modal steps and lands back on Home in one move.
        { at: since(LOG_CONFIRM.dismiss), run: () => router.dismissAll() },
        { at: since(LOG_CONFIRM.ring), run: () => play('logConfirm') },
        { at: since(LOG_CONFIRM.mascot), run: cheer },
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={food.name} />

      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <View style={{ gap: theme.space.md }}>
          <Text color="textSecondary" variant="label">
            How much?
          </Text>
          <Stepper
            onChange={setServings}
            unit={servings === 1 ? food.servingLabel : `× ${food.servingLabel}`}
            value={servings}
          />
        </View>

        <View style={{ gap: theme.space.md }}>
          <Text color="textSecondary" variant="label">
            Meal
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            {MEAL_SLOTS.map((option) => (
              <SlotChip
                key={option}
                onPress={() => setSlot(option)}
                selected={option === slot}
                slot={option}
              />
            ))}
          </View>
        </View>

        <Card>
          <View style={{ alignItems: 'baseline', flexDirection: 'row', gap: theme.space.sm }}>
            <Text variant="display">{Math.round(preview.kcal)}</Text>
            <Text color="textMuted" variant="label">
              kcal
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: theme.space.lg,
              marginTop: theme.space.md,
            }}
          >
            <Macro grams={preview.proteinG} label="Protein" />
            <Macro grams={preview.carbsG} label="Carbs" />
            <Macro grams={preview.fatG} label="Fat" />
          </View>
        </Card>
      </ScrollView>

      <View style={{ padding: theme.space.lg }}>
        <PressableButton
          fullWidth
          label="Log it"
          loading={saving}
          onPress={() => void confirm()}
        />
      </View>
    </Screen>
  );
}

function SlotChip({
  slot,
  selected,
  onPress,
}: {
  slot: MealSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        backgroundColor: selected ? theme.colors.onTrack : theme.colors.surface,
        borderColor: selected ? theme.colors.onTrack : theme.colors.border,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        flex: 1,
        paddingVertical: theme.space.sm,
      }}
    >
      <Text align="center" color={selected ? 'textOnPrimary' : 'textSecondary'} variant="caption">
        {MEAL_SLOT_LABEL[slot]}
      </Text>
    </Pressable>
  );
}

function Macro({ label, grams }: { label: string; grams: number }) {
  return (
    <View style={{ gap: 2 }}>
      <Text color="textMuted" variant="caption">
        {label}
      </Text>
      <Text variant="body">{Math.round(grams)}g</Text>
    </View>
  );
}
