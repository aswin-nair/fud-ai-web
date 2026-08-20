import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, AppState, View, type AppStateStatus } from 'react-native';

import { PressableButton } from '@/components/primitives/PressableButton';
import { Screen } from '@/components/primitives/Screen';
import { Text } from '@/components/primitives/Text';
import { useProfileStore } from '@/stores/profileStore';
import { useTheme } from '@/theme/useTheme';

import { useAppLockStore } from './appLockStore';
import { shouldAutomaticallyPrompt } from './appLockPolicy';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const profilePresent = useProfileStore((state) => state.profile !== null);
  const mode = useAppLockStore((state) => state.mode);
  const locked = useAppLockStore((state) => state.locked);
  const busy = useAppLockStore((state) => state.busy);
  const message = useAppLockStore((state) => state.message);
  const recoveryAllowed = useAppLockStore((state) => state.recoveryAllowed);
  const initialize = useAppLockStore((state) => state.initialize);
  const unlock = useAppLockStore((state) => state.unlock);
  const retry = useAppLockStore((state) => state.retry);
  const continueAfterStorageError = useAppLockStore(
    (state) => state.continueAfterStorageError,
  );
  const resetAfterAuthenticationBecameUnavailable = useAppLockStore(
    (state) => state.resetAfterAuthenticationBecameUnavailable,
  );

  const previousAppState = useRef<AppStateStatus>(AppState.currentState);
  const initialPromptAttempted = useRef(false);

  useEffect(() => {
    void initialize(profilePresent);
  }, [initialize, profilePresent]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = previousAppState.current;
      previousAppState.current = nextState;

      if (nextState !== 'active') {
        useAppLockStore.getState().lockForBackground();
        return;
      }

      if (previousState !== 'active') {
        void useAppLockStore.getState().unlock();
      }
    });

    return () => subscription.remove();
  }, []);

  // One automatic prompt on a cold launch. Cancellation leaves a calm retry
  // button and never creates a prompt loop.
  useEffect(() => {
    if (
      shouldAutomaticallyPrompt({
        enabled: mode === 'on',
        locked,
        busy,
        appIsActive: AppState.currentState === 'active',
        alreadyAttempted: initialPromptAttempted.current,
      })
    ) {
      initialPromptAttempted.current = true;
      void unlock();
    }

    if (mode !== 'on' || !locked) {
      initialPromptAttempted.current = false;
    }
  }, [busy, locked, mode, unlock]);

  if (mode === 'loading') {
    return <AppLockStatusScreen />;
  }

  if (mode === 'storage-error' && locked) {
    return (
      <AppLockStatusScreen
        description={message ?? 'The secure app-lock preference could not be read.'}
        primaryAction={{ label: 'Retry secure storage', onPress: () => void retry() }}
        secondaryAction={{
          label: 'Continue for this session',
          onPress: () =>
            Alert.alert(
              'Continue without app lock?',
              'The secure preference could not be read. Continuing will show the local log without app-lock protection until Fud AI restarts.',
              [
                { text: 'Keep app covered', style: 'cancel' },
                { text: 'Continue', onPress: continueAfterStorageError },
              ],
            ),
        }}
        title="App lock needs attention"
      />
    );
  }

  if (mode === 'on' && locked) {
    return (
      <AppLockStatusScreen
        busy={busy}
        description={
          message ?? 'Use your enrolled device authentication to view your local food log.'
        }
        primaryAction={{ label: 'Unlock app', onPress: () => void unlock() }}
        secondaryAction={
          recoveryAllowed
            ? {
                label: 'Turn off app lock on this device',
                onPress: () =>
                  Alert.alert(
                    'Turn off app lock?',
                    'Device authentication is unavailable. Turning off the lock will make the local log visible whenever the device is unlocked.',
                    [
                      { text: 'Keep app locked', style: 'cancel' },
                      {
                        text: 'Turn off lock',
                        onPress: () => void resetAfterAuthenticationBecameUnavailable(),
                      },
                    ],
                  ),
              }
            : undefined
        }
        title="App locked"
      />
    );
  }

  return children;
}

type StatusAction = {
  label: string;
  onPress: () => void;
};

function AppLockStatusScreen({
  title = 'Checking app lock',
  description = 'Checking the secure setting before showing your local log.',
  busy = false,
  primaryAction,
  secondaryAction,
}: {
  title?: string;
  description?: string;
  busy?: boolean;
  primaryAction?: StatusAction;
  secondaryAction?: StatusAction;
}) {
  const theme = useTheme();

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View
        accessibilityViewIsModal
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: theme.space.xl,
          paddingHorizontal: theme.space.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.space.md }}>
          {!primaryAction ? <ActivityIndicator color={theme.colors.onTrack} /> : null}
          <Text accessibilityRole="header" align="center" variant="title">
            {title}
          </Text>
          <Text align="center" color="textSecondary" variant="body">
            {description}
          </Text>
        </View>

        {primaryAction ? (
          <View style={{ gap: theme.space.md }}>
            <PressableButton
              fullWidth
              label={primaryAction.label}
              loading={busy}
              onPress={primaryAction.onPress}
            />
            {secondaryAction ? (
              <PressableButton
                fullWidth
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}

        <Text align="center" color="textMuted" variant="caption">
          App lock requires authentication when Fud AI returns from the background. It does
          not encrypt the SQLite food log or replace the device lock.
        </Text>
      </View>
    </Screen>
  );
}
