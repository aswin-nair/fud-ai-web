import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

/**
 * Phase 1 harness, not product UI. It exists so expo-router has a route and so
 * the theme layer and both font families can be checked on a device.
 * Phase 2 replaces it with the primitives gallery.
 */
export default function Index() {
  const { colors, type, space, scheme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, gap: space.sm }]}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: type.display,
          fontSize: type.size.display,
        }}
      >
        Fredoka display
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontFamily: type.body,
          fontSize: type.size.body,
        }}
      >
        Nunito Sans body
      </Text>
      <Text
        style={{
          color: colors.textMuted,
          fontFamily: type.bodyBold,
          fontSize: type.size.label,
        }}
      >
        {scheme} scheme
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
