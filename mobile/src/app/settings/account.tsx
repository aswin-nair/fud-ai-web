import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useAccountStore } from '@/account/sessionStore';
import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { SettingRow } from '@/components/primitives/SettingRow';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { useTheme } from '@/theme/useTheme';

export default function AccountSettings() {
  const theme = useTheme();
  const status = useAccountStore((state) => state.status);
  const email = useAccountStore((state) => state.email);
  const name = useAccountStore((state) => state.name);
  const message = useAccountStore((state) => state.message);
  const busy = useAccountStore((state) => state.busy);
  const initialize = useAccountStore((state) => state.initialize);
  const signIn = useAccountStore((state) => state.signIn);
  const register = useAccountStore((state) => state.register);
  const signOut = useAccountStore((state) => state.signOut);
  const signOutEverywhere = useAccountStore((state) => state.signOutEverywhere);
  const deleteAccount = useAccountStore((state) => state.deleteAccount);

  const [mode, setMode] = useState<'sign-in' | 'register'>('sign-in');
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function submit() {
    if (mode === 'register') {
      await register(nameValue, emailValue, password);
      return;
    }
    await signIn(emailValue, password);
  }

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
        <ScreenHeader title="Account" />

        <View style={{ gap: theme.space.lg, paddingHorizontal: theme.space.lg }}>
          <Card>
            <Text variant="subtitle">This device stays local</Text>
            <Text color="textSecondary" style={{ marginTop: theme.space.sm }} variant="body">
              Signing in does not upload existing meals. Cloud sync stays off until it is
              explicitly enabled. The first cloud beta is new accounts only.
            </Text>
          </Card>

          {status === 'unavailable' || status === 'storage-error' ? (
            <Card>
              <Text variant="body">{message}</Text>
            </Card>
          ) : null}

          {status === 'signed-in' ? (
            <Card>
              <View style={{ gap: theme.space.md }}>
                <Text variant="subtitle">{name ?? 'Signed in'}</Text>
                <Text color="textSecondary" variant="body">
                  {email}
                </Text>
                <PressableButton
                  fullWidth
                  label="Sign out"
                  loading={busy}
                  onPress={() => void signOut()}
                  variant="secondary"
                />
                <PressableButton
                  fullWidth
                  label="Sign out everywhere"
                  loading={busy}
                  onPress={() => void signOutEverywhere()}
                  variant="secondary"
                />
                <TextField
                  autoCapitalize="characters"
                  label="Type DELETE to remove the cloud account"
                  onChangeText={setConfirmDelete}
                  placeholder="DELETE"
                  value={confirmDelete}
                />
                <PressableButton
                  disabled={confirmDelete.trim() !== 'DELETE'}
                  fullWidth
                  label="Delete account"
                  loading={busy}
                  onPress={() => void deleteAccount()}
                  variant="destructive"
                />
              </View>
            </Card>
          ) : null}

          {status === 'signed-out' || status === 'loading' ? (
            <Card>
              <View style={{ gap: theme.space.md }}>
                {mode === 'register' ? (
                  <TextField
                    autoCapitalize="words"
                    label="Name"
                    onChangeText={setNameValue}
                    value={nameValue}
                  />
                ) : null}
                <TextField
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  onChangeText={setEmailValue}
                  value={emailValue}
                />
                <TextField
                  autoCapitalize="none"
                  label="Password"
                  onChangeText={setPassword}
                  secureTextEntry
                  value={password}
                />
                <PressableButton
                  fullWidth
                  label={mode === 'register' ? 'Create account' : 'Sign in'}
                  loading={busy}
                  onPress={() => void submit()}
                />
                <PressableButton
                  fullWidth
                  label={mode === 'register' ? 'Use an existing account' : 'Create an account'}
                  onPress={() => setMode(mode === 'register' ? 'sign-in' : 'register')}
                  variant="secondary"
                />
                <SettingRow
                  kind="navigate"
                  label="Forgot password"
                  onPress={() => router.push('/settings/account-recovery' as Href)}
                />
              </View>
            </Card>
          ) : null}

          {message && status !== 'unavailable' && status !== 'storage-error' ? (
            <Text accessibilityLiveRegion="polite" color="textSecondary" variant="body">
              {message}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
