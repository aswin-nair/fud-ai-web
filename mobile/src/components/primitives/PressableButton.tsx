import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export type PressableButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /**
   * Prefer leaving this off. A greyed button with no explanation is a dead
   * end — keep it enabled and show an inline reason on press instead.
   */
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

/** Height of the exposed shadow face, and the distance the button travels. */
const DEPTH = 4;
const FACE_HEIGHT = 52;

const PALETTES: Record<ButtonVariant, { face: ColorToken; deep: ColorToken; label: ColorToken }> =
  {
    primary: { face: 'onTrack', deep: 'onTrackDeep', label: 'textOnFill' },
    secondary: { face: 'surface', deep: 'border', label: 'textPrimary' },
    destructive: { face: 'danger', deep: 'dangerDeep', label: 'textOnFill' },
  };

/**
 * A raised button built as two stacked views rather than an animated border,
 * which React Native cannot interpolate smoothly.
 *
 * The face is the in-flow child so the button can size to its label, and the
 * static shadow is absolutely positioned DEPTH lower. Pressing slides the face
 * down onto the shadow. An absolutely positioned face, as the spec sketches,
 * contributes no intrinsic width and collapses every non-stretch button.
 */
export function PressableButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: PressableButtonProps) {
  const theme = useTheme();
  const scheme = PALETTES[variant];
  const inert = disabled || loading;

  // 0 is raised, DEPTH is fully depressed onto the shadow.
  const press = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: press.value }] }));

  function handlePressIn() {
    if (inert) return;
    press.value = withTiming(DEPTH, { duration: theme.motion.press });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handlePressOut() {
    if (inert) return;
    press.value = withSpring(0, { damping: 15, stiffness: 400 });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        {
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
          paddingBottom: DEPTH,
          position: 'relative',
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: theme.colors[scheme.deep],
          borderRadius: theme.radius.lg,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: DEPTH,
        }}
      />
      <Animated.View
        style={[
          {
            alignItems: 'center',
            backgroundColor: theme.colors[scheme.face],
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
            borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
            height: FACE_HEIGHT,
            justifyContent: 'center',
            paddingHorizontal: theme.space.xl,
          },
          faceStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors[scheme.label]} />
        ) : (
          <Text variant="label" color={scheme.label} tracking="button" numberOfLines={1}>
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
