import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { TextField } from '@/components/primitives/TextField';
import { useApp } from '@/state/AppProvider';
import { stampEntry } from '@/state/awards';
import { useTheme } from '@/theme/useTheme';

export default function ManualLog() {
  const theme = useTheme();
  const { addEntry } = useApp();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  return (
    <Screen>
      <ScreenHeader title="Manual log" />
      <View style={{ gap: theme.space.md, padding: theme.space.lg }}>
        <TextField label="Name" onChangeText={setName} value={name} />
        <TextField keyboardType="numeric" label="kcal" onChangeText={setCalories} value={calories} />
        <TextField keyboardType="numeric" label="Protein" onChangeText={setProtein} value={protein} />
        <TextField keyboardType="numeric" label="Carbs" onChangeText={setCarbs} value={carbs} />
        <TextField keyboardType="numeric" label="Fat" onChangeText={setFat} value={fat} />
        <PressableButton
          fullWidth
          label="Save"
          onPress={() => {
            addEntry(stampEntry({
              id: crypto.randomUUID(),
              name: name.trim() || 'Manual meal',
              calories: Number(calories) || 0,
              protein: Number(protein) || 0,
              carbs: Number(carbs) || 0,
              fat: Number(fat) || 0,
              timestamp: new Date().toISOString(),
              source: 'manual',
              mealType: 'other',
              detailAdded: true,
            }));
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
