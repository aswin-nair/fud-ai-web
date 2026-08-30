import { postAccount, parseMobileSession } from '@/account/client'
import { readMobileAccountConfig } from '@/account/config'
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { TextField } from '@/components/primitives/TextField';
import { useApp } from '@/state/AppProvider';
import { saveSessionTokens } from '@/state/secrets';
import { useTheme } from '@/theme/useTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

export default function Login() {
  const theme = useTheme();
  const { claimForAccount, finishClaim } = useApp();
  const params = useLocalSearchParams<{ claim?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const config = readMobileAccountConfig();

  async function submit(path: '/api/auth/login' | '/api/auth/register') {
    setBusy(true);
    setError(null);
    const result = await postAccount(path, { email, password });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    const session = parseMobileSession(result.value);
    if (!session) {
      setError('Sign-in did not return a session.');
      setBusy(false);
      return;
    }
    await saveSessionTokens(session.token, session.refreshToken);
    if (params.claim === '1') {
      const staged = await claimForAccount(session.user.sub);
      if (staged) await finishClaim(session.user.sub);
    }
    setBusy(false);
    router.replace('/');
  }

  return (
    <Screen>
      <ScreenHeader title="Account" />
      <View style={{ gap: theme.space.md, padding: theme.space.lg }}>
        {!config.mobileAuthEnabled ? (
          <Text color="textSecondary">
            Cloud sign-in is off until EXPO_PUBLIC_API_BASE_URL and EXPO_PUBLIC_ENABLE_MOBILE_AUTH are set.
          </Text>
        ) : null}
        <TextField autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={setEmail} value={email} />
        <TextField label="Password" onChangeText={setPassword} secureTextEntry value={password} />
        {error ? <Text color="danger">{error}</Text> : null}
        <PressableButton fullWidth label="Sign in" loading={busy} onPress={() => void submit('/api/auth/login')} />
        <PressableButton label="Create account" onPress={() => void submit('/api/auth/register')} variant="secondary" />
      </View>
    </Screen>
  );
}
