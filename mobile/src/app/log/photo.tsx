import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { useApp } from '@/state/AppProvider';
import { stampEntry } from '@/state/awards';
import { useTheme } from '@/theme/useTheme';

export default function PhotoLog() {
  const theme = useTheme();
  const { addEntry, guest } = useApp();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [busy, setBusy] = useState(false);

  function save() {
    if (guest) {
      router.replace('/login?claim=1' as never);
      return;
    }
    setBusy(true);
    addEntry(stampEntry({
      id: crypto.randomUUID(),
      name: name.trim() || 'Photo meal',
      calories: Number(calories) || 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      timestamp: new Date().toISOString(),
      source: 'snapFood',
      mealType: 'lunch',
      detailAdded: true,
    }));
    setBusy(false);
    router.replace('/');
  }

  return (
    <Screen>
      <ScreenHeader title="Photo log" />
      <View style={{ gap: theme.space.lg, padding: theme.space.lg }}>
        {busy ? <Text>Looking at the plate…</Text> : null}
        <Text color="textSecondary">
          Camera permission is requested on a development build. Describe the meal if the photo is not ready.
        </Text>
        <TextField label="What is it?" onChangeText={setName} value={name} />
        <TextField keyboardType="numeric" label="kcal" onChangeText={setCalories} value={calories} />
        <PressableButton fullWidth label="Log photo meal" loading={busy} onPress={save} />
        <PressableButton label="Type instead" onPress={() => router.replace('/log/text' as never)} variant="secondary" />
        <PressableButton label="Manual" onPress={() => router.replace('/log/manual' as never)} variant="secondary" />
      </View>
    </Screen>
  );
}
