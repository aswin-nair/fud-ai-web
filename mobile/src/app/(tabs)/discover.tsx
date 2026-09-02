import { router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { stampEntry } from '@/state/awards';
import { useTheme } from '@/theme/useTheme';

export default function Saved() {
  const theme = useTheme();
  const { state, addEntry } = useApp();
  const recents = [...state.foodEntries].reverse().filter((entry, index, all) => (
    all.findIndex(item => item.name === entry.name) === index
  )).slice(0, 12);

  return (
    <Screen>
      <ScreenHeader showBack={false} title="Saved" />
      <ScrollView contentContainerStyle={{ gap: theme.space.md, padding: theme.space.lg }}>
        <Text color="textSecondary">Saved and recent meals. Repeat a log without another photo.</Text>
        {state.favoriteMeals.map(meal => (
          <Pressable
            key={meal.id}
            accessibilityLabel={`Log ${meal.name}, ${Math.round(meal.calories)} kilocalories`}
            accessibilityRole="button"
            onPress={() => {
              addEntry(stampEntry({
                id: crypto.randomUUID(),
                name: meal.name,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                timestamp: new Date().toISOString(),
                source: 'recent',
                mealType: meal.mealType,
              }));
              router.replace('/');
            }}
          >
            <Card>
              <Text variant="subtitle">{meal.name}</Text>
              <Text color="textSecondary">{Math.round(meal.calories)} kcal</Text>
            </Card>
          </Pressable>
        ))}
        {recents.map(meal => (
          <Pressable
            key={meal.id}
            accessibilityLabel={`Log ${meal.name} again, ${Math.round(meal.calories)} kilocalories`}
            accessibilityRole="button"
            onPress={() => {
              addEntry(stampEntry({ ...meal, id: crypto.randomUUID(), timestamp: new Date().toISOString(), source: 'recent' }));
              router.replace('/');
            }}
          >
            <Card>
              <Text variant="body">{meal.name}</Text>
              <Text color="textSecondary" variant="caption">Repeat</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
