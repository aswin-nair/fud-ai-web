import { View } from 'react-native';

import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

/**
 * Shown only when the database cannot be migrated. Deliberately plain: there
 * is no store to read from, so nothing richer would render.
 */
export function StartupError({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        flex: 1,
        gap: theme.space.md,
        justifyContent: 'center',
        padding: theme.space.xl,
      }}
    >
      <Text variant="title" align="center">
        We could not open your food log
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        Restarting the app usually fixes this. If it keeps happening, reinstalling
        will rebuild the database.
      </Text>
      <Text variant="caption" color="textMuted" align="center">
        {message}
      </Text>
    </View>
  );
}
