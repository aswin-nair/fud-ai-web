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

import { useMigrations } from '@/db/migrate';
import { seedBuiltinFoods } from '@/db/seed';
import { StartupError } from '@/components/StartupError';
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
  const [seeded, setSeeded] = useState(false);

  const fontsSettled = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (!migrated) return;

    // Only populates an empty table, so this is a cheap no-op after install.
    void seedBuiltinFoods()
      .catch(() => undefined)
      .finally(() => setSeeded(true));
  }, [migrated]);

  const ready = fontsSettled && migrated && seeded;

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

  // Holding the splash screen avoids a frame of system-font text before the
  // real families are ready, and a first paint against an unmigrated database.
  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
