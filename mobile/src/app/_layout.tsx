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
import { AppLockGate } from '@/security/AppLockGate';
import { useProfileStore } from '@/stores/profileStore';
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
  const loadProfile = useProfileStore((s) => s.load);
  const soundOn = useProfileStore((s) => s.profile?.soundEnabled ?? true);
  const hapticsOn = useProfileStore((s) => s.profile?.hapticsEnabled ?? true);

  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (!migrated) return;

    // Seeding only populates an empty table, so this is a no-op after install.
    void seedBuiltinFoods()
      .catch(() => undefined)
      .then(() => loadProfile())
      .catch(() => undefined)
      .finally(() => setDataReady(true));
  }, [migrated, loadProfile]);

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
  useEffect(() => {
    setSoundEnabled(soundOn);
    setHapticsEnabled(hapticsOn);
  }, [soundOn, hapticsOn]);

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
        <AppLockGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(onboarding)" />
            {/* The two log steps sit on the root stack rather than a nested one so
                that dismissAll() on confirm returns all the way to Home. */}
            <Stack.Screen name="log/index" options={{ presentation: 'modal' }} />
            <Stack.Screen name="log/portion" options={{ presentation: 'modal' }} />
            <Stack.Screen name="entry/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </AppLockGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
