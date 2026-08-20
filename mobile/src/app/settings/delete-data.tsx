import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { DELETE_CONFIRMATION_TEXT, confirmationMatches } from '@/privacy/deletePlan';
import { deleteAllLocalData } from '@/privacy/localData';
import { useTheme } from '@/theme/useTheme';

export default function DeleteAllData() {
  const theme = useTheme();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmationMatches(typed);

  async function remove() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);

    const result = await deleteAllLocalData();
    if (!result.ok) {
      const failed = result.results
        .filter((row) => !row.ok)
        .map((row) => row.store)
        .join(', ');
      setError(
        failed
          ? `Some stores could not be cleared (${failed}). Nothing is marked deleted until every store confirms.`
          : 'Deletion did not finish. Try again.',
      );
      setBusy(false);
      return;
    }

    router.replace('/(onboarding)');
  }

  return (
    <Screen>
      <ScreenHeader title="Delete all data" />
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          padding: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text variant="subtitle">This cannot be undone</Text>
          <Text color="textSecondary" style={{ marginTop: theme.space.sm }} variant="body">
            It removes your profile, meals, custom foods, quests, streak freezes, onboarding
            draft, local events, account session, sync queue, and app lock from this
            device. Builtin foods are put back after the wipe confirms.
          </Text>
        </Card>

        <TextField
          autoCapitalize="characters"
          label={`Type ${DELETE_CONFIRMATION_TEXT} to confirm`}
          onChangeText={setTyped}
          placeholder={DELETE_CONFIRMATION_TEXT}
          value={typed}
        />

        {error ? (
          <Text color="textSecondary" variant="body">
            {error}
          </Text>
        ) : null}

        <PressableButton
          disabled={!confirmed}
          fullWidth
          label="Delete all data"
          loading={busy}
          onPress={() => void remove()}
          variant="destructive"
        />

        <PressableButton
          fullWidth
          label="Cancel"
          onPress={() => router.back()}
          variant="secondary"
        />
      </ScrollView>
    </Screen>
  );
}
