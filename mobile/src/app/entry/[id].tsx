import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useApp } from '@/state/AppProvider';
import { useTheme } from '@/theme/useTheme';

export default function EditEntry() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, deleteEntry } = useApp();
  const entry = state.foodEntries.find(item => item.id === id);

  if (!entry) {
    return (
      <Screen>
        <ScreenHeader title="Entry" />
        <Text color="textSecondary" style={{ padding: theme.space.lg }}>This log is gone.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={entry.name} />
      <View style={{ gap: theme.space.lg, padding: theme.space.lg }}>
        <Text>{Math.round(entry.calories)} kcal</Text>
        <Text color="textSecondary">{entry.mealType}</Text>
        <PressableButton
          label="Delete"
          onPress={() => {
            Alert.alert('Delete this entry?', 'It will be removed from your log.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteEntry(entry.id);
                  router.back();
                },
              },
            ]);
          }}
          variant="destructive"
        />
      </View>
    </Screen>
  );
}
