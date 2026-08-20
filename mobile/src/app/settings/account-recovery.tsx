import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useAccountStore } from '@/account/sessionStore';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { useTheme } from '@/theme/useTheme';

export default function AccountRecovery() {
  const theme = useTheme();
  const message = useAccountStore((state) => state.message);
  const busy = useAccountStore((state) => state.busy);
  const requestReset = useAccountStore((state) => state.requestReset);
  const [email, setEmail] = useState('');

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          paddingBottom: theme.space.xxl,
          paddingTop: theme.space.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Forgot password" />
        <View style={{ gap: theme.space.lg, paddingHorizontal: theme.space.lg }}>
          <Card>
            <Text color="textSecondary" variant="body">
              If that address can receive mail, a reset link will arrive shortly. The app
              does not say whether an account exists.
            </Text>
          </Card>
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            value={email}
          />
          <PressableButton
            fullWidth
            label="Send reset link"
            loading={busy}
            onPress={() => void requestReset(email)}
          />
          {message ? (
            <Text accessibilityLiveRegion="polite" color="textSecondary" variant="body">
              {message}
            </Text>
          ) : null}
          <PressableButton
            fullWidth
            label="Back"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
