import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen } from '@/components/primitives/Screen';
import { Sheet } from '@/components/primitives/Sheet';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { getRecentsAndFavorites, searchFoods } from '@/db/queries/foods';
import { type Food } from '@/db/schema';
import { defaultMealSlot } from '@/logic/mealSlot';
import { localHourIn } from '@/logic/dates';
import { logEntry } from '@/db/queries/entries';
import { useLogStore } from '@/stores/logStore';
import { recordLog } from '@/stores/progression';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

export default function LogSearch() {
  const theme = useTheme();
  const pick = useLogStore((s) => s.pick);
  const timezone = useProfileStore((s) => s.timezone);
  const proteinTarget = useProfileStore((s) => s.profile?.proteinGTarget ?? 0);

  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recents, setRecents] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    void getRecentsAndFavorites()
      .then(setRecents)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void searchFoods(query)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const choose = useCallback(
    (food: Food, source: 'recent' | 'search') => {
      pick(food, source);
      router.push('/log/portion');
    },
    [pick],
  );

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: theme.space.md,
          padding: theme.space.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <TextField
            autoFocus
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="Search foods"
            ref={input}
            returnKeyType="search"
            value={query}
          />
        </View>
        <Pressable
          accessibilityLabel="Close"
          accessibilityRole="button"
          hitSlop={theme.space.md}
          onPress={() => router.back()}
        >
          <Icon color="textSecondary" name="close" size={theme.type.size.title} />
        </Pressable>
      </View>

      {/* Recents and favourites are what make repeat logging fast — most people
          eat the same twenty things — so they sit above the results. */}
      {query.trim().length === 0 && recents.length > 0 ? (
        <View style={{ gap: theme.space.sm, paddingBottom: theme.space.md }}>
          <Text
            color="textSecondary"
            style={{ paddingHorizontal: theme.space.lg }}
            variant="label"
          >
            Recent and saved
          </Text>
          <ScrollView
            contentContainerStyle={{ gap: theme.space.sm, paddingHorizontal: theme.space.lg }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {recents.map((food) => (
              <Pressable key={food.id} onPress={() => choose(food, 'recent')}>
                <Card style={{ maxWidth: 180, padding: theme.space.md }}>
                  <Text numberOfLines={1} variant="body">
                    {food.name}
                  </Text>
                  <Text color="textMuted" variant="caption">
                    {Math.round(food.kcal)} kcal · {food.servingLabel}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={{ paddingBottom: theme.space.xxl }}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          query.trim().length === 0 && results.length > 0 ? (
            <Text
              color="textSecondary"
              style={{ paddingBottom: theme.space.sm, paddingHorizontal: theme.space.lg }}
              variant="label"
            >
              {recents.length > 0 ? 'All foods' : 'Common foods'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: theme.space.xl }} />
          ) : (
            <EmptyResults onQuickAdd={() => setQuickAddOpen(true)} query={query} />
          )
        }
        renderItem={({ item }) => (
          <FoodRow food={item} onPress={() => choose(item, query ? 'search' : 'recent')} />
        )}
      />

      <View
        style={{
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          padding: theme.space.lg,
        }}
      >
        <PressableButton
          fullWidth
          label="Quick add calories"
          onPress={() => setQuickAddOpen(true)}
          variant="secondary"
        />
      </View>

      <QuickAdd
        onDismiss={() => setQuickAddOpen(false)}
        proteinTarget={proteinTarget}
        timezone={timezone()}
        visible={quickAddOpen}
      />
    </Screen>
  );
}

function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        gap: theme.space.md,
        paddingHorizontal: theme.space.lg,
        paddingVertical: theme.space.md,
      }}
    >
      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text numberOfLines={1} variant="body">
          {food.name}
        </Text>
        <Text color="textMuted" variant="caption">
          {food.brand ? `${food.brand} · ` : ''}
          {food.servingLabel}
        </Text>
      </View>
      <Text color="textSecondary" variant="label">
        {Math.round(food.kcal)} kcal
      </Text>
    </Pressable>
  );
}

function EmptyResults({ query, onQuickAdd }: { query: string; onQuickAdd: () => void }) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.md, padding: theme.space.xl }}>
      <Text align="center" variant="subtitle">
        {query.trim() ? `Nothing matching "${query.trim()}"` : 'Start typing to search'}
      </Text>
      <Text align="center" color="textSecondary" variant="body">
        You can still log it as a calorie number and keep the day counted.
      </Text>
      <PressableButton
        fullWidth
        label="Quick add calories"
        onPress={onQuickAdd}
        variant="secondary"
      />
    </View>
  );
}

/**
 * A raw calorie number with no food attached. Some days people will not log
 * properly, and a quick add that keeps the day counted beats a skipped day.
 */
function QuickAdd({
  visible,
  onDismiss,
  timezone,
  proteinTarget,
}: {
  visible: boolean;
  onDismiss: () => void;
  timezone: string;
  proteinTarget: number;
}) {
  const theme = useTheme();
  const [kcal, setKcal] = useState('');
  const [saving, setSaving] = useState(false);

  const value = Number(kcal);
  const valid = value > 0 && value < 10000;

  async function save() {
    if (!valid) return;
    setSaving(true);

    try {
      await logEntry({
        customName: 'Quick add',
        servings: 1,
        kcal: value,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        mealSlot: defaultMealSlot(localHourIn(timezone)),
        timezone,
      });

      await recordLog(timezone, { proteinG: proteinTarget });
      setKcal('');
      onDismiss();
      router.dismissAll();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet onDismiss={onDismiss} visible={visible}>
      <Text variant="title">Quick add</Text>
      <Text color="textSecondary" variant="body">
        Just the calories. You can fill in the details later, or not at all.
      </Text>
      <TextField
        autoFocus
        keyboardType="number-pad"
        onChangeText={setKcal}
        placeholder="0"
        suffix="kcal"
        value={kcal}
      />
      <View style={{ height: theme.space.sm }} />
      <PressableButton
        disabled={!valid}
        fullWidth
        label="Log it"
        loading={saving}
        onPress={() => void save()}
      />
    </Sheet>
  );
}
