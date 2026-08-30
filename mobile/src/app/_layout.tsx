// Per-weight subpaths, not the package root: importing the root makes Metro
// bundle every weight and italic of both families.
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular';
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { StartupError } from '@/components/StartupError';
import { useMigrations } from '@/db/migrate';
import { seedBuiltinFoods } from '@/db/seed';
import { setHapticsEnabled } from '@/feel/haptics';
import { initMotion } from '@/feel/motion';
import { initSound, releaseSound, setSoundEnabled } from '@/feel/sound';
import { excludeNutritionDatabaseFromBackup } from '@/privacy/databaseBackupNative';
import { loadRestoredOnboardingDraft } from '@/privacy/onboardingDraftStore';
import { AppLockGate } from '@/security/AppLockGate';
import { AppProvider, useApp } from '@/state/AppProvider';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
  });

  const { success: migrated, error: migrationError } = useMigrations();
  const [dataReady, setDataReady] = useState(false);

  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (!migrated) return;

    // Seeding only populates an empty table, so this is a no-op after install.
    void seedBuiltinFoods()
      .catch(() => undefined)
      .then(async () => {
        const draft = await loadRestoredOnboardingDraft();
        if (draft) useOnboardingStore.getState().set(draft);
        await excludeNutritionDatabaseFromBackup();
      })
      .catch(() => undefined)
      .finally(() => setDataReady(true));
  }, [migrated]);

  // The feel layer is set up once, before any screen can fire a cue.
  useEffect(() => {
    const stopMotion = initMotion();
    void initSound();

    return () => {
      stopMotion();
      releaseSound();
    };
  }, []);

  // Both toggles are stored on the profile but consumed by plain modules, so
  // they are pushed across here rather than read at each call site. Covers the
  // initial load and every later flip of the switch in settings.
  // Feel toggles are pushed from AppFeelBridge after AppProvider mounts.

  const ready = fontsSettled && migrated && dataReady;

  useEffect(() => {
    if (ready || migrationError) {
      void SplashScreen.hideAsync();
    }
  }, [ready, migrationError]);

  // A failed migration means no usable database. Say so rather than booting
  // into an app whose every read throws.
  if (migrationError) {
    return (
      <ThemeProvider>
        <StartupError message={migrationError.message} />
      </ThemeProvider>
    );
  }

  // Holding the splash avoids a frame of system-font text before the real
  // families are ready, and a first paint against an unmigrated database.
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AppProvider>
          <FeelBridge />
          <AppLockGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="log/index" options={{ presentation: 'modal' }} />
              <Stack.Screen name="log/portion" options={{ presentation: 'modal' }} />
              <Stack.Screen name="log/photo" options={{ presentation: 'modal' }} />
              <Stack.Screen name="log/text" options={{ presentation: 'modal' }} />
              <Stack.Screen name="log/manual" options={{ presentation: 'modal' }} />
              <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="coach" />
            </Stack>
          </AppLockGate>
        </AppProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function FeelBridge() {
  const { state } = useApp();
  useEffect(() => {
    setSoundEnabled(state.profile.soundEnabled ?? true);
    setHapticsEnabled(state.profile.hapticsEnabled ?? true);
  }, [state.profile.hapticsEnabled, state.profile.soundEnabled]);
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
