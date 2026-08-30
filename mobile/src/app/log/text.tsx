import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { TextField } from '@/components/primitives/TextField';
import { useApp } from '@/state/AppProvider';
import { stampEntry } from '@/state/awards';
import { useTheme } from '@/theme/useTheme';

export default function TextLog() {
  const theme = useTheme();
  const { addEntry } = useApp();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  return (
    <Screen>
      <ScreenHeader title="Text log" />
      <View style={{ gap: theme.space.lg, padding: theme.space.lg }}>
        <TextField label="What did you eat?" onChangeText={setName} value={name} />
        <TextField keyboardType="numeric" label="kcal" onChangeText={setCalories} value={calories} />
        <PressableButton
          fullWidth
          label="Log"
          onPress={() => {
            addEntry(stampEntry({
              id: crypto.randomUUID(),
              name: name.trim() || 'Text meal',
              calories: Number(calories) || 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              timestamp: new Date().toISOString(),
              source: 'textInput',
              mealType: 'lunch',
              detailAdded: true,
            }));
            router.replace('/');
          }}
        />
      </View>
    </Screen>
  );
}
