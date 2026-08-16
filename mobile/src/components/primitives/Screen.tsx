import { router } from 'expo-router';
import { Pressable, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { ProgressBar } from '@/components/primitives/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export type ScreenProps = {
  children?: React.ReactNode;
  edges?: readonly Edge[];
  style?: ViewStyle;
};

export function Screen({ children, edges = ['top', 'left', 'right'], style }: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export type ScreenHeaderProps = {
  title?: string;
  /** 0 to 1. Shown as a thin bar under the row during onboarding. */
  progress?: number;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
};

export function ScreenHeader({
  title,
  progress,
  onBack,
  showBack = true,
  right,
}: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.md, paddingHorizontal: theme.space.lg }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: theme.space.md,
          minHeight: 44,
        }}
      >
        {showBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={theme.space.md}
            onPress={onBack ?? (() => router.back())}
          >
            <Icon color="textPrimary" name="chevronLeft" size={theme.type.size.title} />
          </Pressable>
        ) : null}

        <Text variant="title" style={{ flex: 1 }}>
          {title ?? ''}
        </Text>

        {right}
      </View>

      {progress !== undefined ? (
        <ProgressBar color="onTrack" height={4} max={1} value={progress} />
      ) : null}
    </View>
  );
}
