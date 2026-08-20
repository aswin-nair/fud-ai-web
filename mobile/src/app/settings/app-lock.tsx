import { ScrollView, View } from 'react-native';

import { Card } from '@/components/primitives/Card';
import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen, ScreenHeader } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useAppLockStore } from '@/security/appLockStore';
import { useTheme } from '@/theme/useTheme';

export default function AppLockSettings() {
  const theme = useTheme();
  const mode = useAppLockStore((state) => state.mode);
  const busy = useAppLockStore((state) => state.busy);
  const message = useAppLockStore((state) => state.message);
  const enable = useAppLockStore((state) => state.enable);
  const disable = useAppLockStore((state) => state.disable);
  const retry = useAppLockStore((state) => state.retry);

  const status = {
    loading: 'Checking',
    off: 'Off',
    on: 'On',
    unsupported: 'Not available',
    'storage-error': 'Needs attention',
    'session-bypass': 'Unavailable this session',
  }[mode];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.space.xl,
          paddingBottom: theme.space.xxl,
          paddingTop: theme.space.md,
        }}
      >
        <ScreenHeader title="App lock" />

        <View style={{ gap: theme.space.lg, paddingHorizontal: theme.space.lg }}>
          <Card>
            <View style={{ gap: theme.space.md }}>
              <Text color="textMuted" variant="caption">
                Status
              </Text>
              <Text accessibilityLiveRegion="polite" variant="subtitle">
                {status}
              </Text>
              <Text color="textSecondary" variant="body">
                When on, Fud AI asks for a strong enrolled biometric after launch and when
                returning from the background. The operating system may offer the device
                passcode as a fallback.
              </Text>
            </View>
          </Card>

          <Text color="textSecondary" variant="body">
            This optional screen lock helps with casual access on a shared device. It does not
            encrypt the local SQLite food log, hide information from an already unlocked app,
            or replace the device lock.
          </Text>

          {message ? (
            <Text accessibilityLiveRegion="polite" color="textSecondary" variant="body">
              {message}
            </Text>
          ) : null}

          {mode === 'on' ? (
            <PressableButton
              fullWidth
              label="Turn off app lock"
              loading={busy}
              onPress={() => void disable()}
              variant="secondary"
            />
          ) : null}

          {mode === 'off' ? (
            <PressableButton
              fullWidth
              label="Turn on app lock"
              loading={busy}
              onPress={() => void enable()}
            />
          ) : null}

          {mode === 'session-bypass' || mode === 'storage-error' ? (
            <PressableButton
              fullWidth
              label="Retry secure storage"
              loading={busy}
              onPress={() => void retry()}
            />
          ) : null}

          {mode === 'unsupported' ? (
            <Text color="textMuted" variant="caption">
              App lock is available in installed iOS and Android builds. It is not available in
              the web build.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

