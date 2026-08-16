import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/useTheme';

export type CardTint = 'streak' | 'onTrack';

export type CardProps = ViewProps & {
  tint?: CardTint | null;
  style?: ViewStyle;
};

/**
 * No drop shadow, by design. Elevation in this app is expressed only by the
 * raised treatment on PressableButton; mixing the two reads as noise.
 */
export function Card({ tint = null, style, ...rest }: CardProps) {
  const theme = useTheme();

  const background =
    tint === 'streak'
      ? theme.colors.tintStreak
      : tint === 'onTrack'
        ? theme.colors.tintOnTrack
        : theme.colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          padding: theme.space.lg,
        },
        style,
      ]}
      {...rest}
    />
  );
}
