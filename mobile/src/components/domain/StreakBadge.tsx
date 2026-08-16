import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export type StreakBadgeProps = {
  count: number;
  /** Derived by logic/streak using the profile's local date and hour. */
  atRisk: boolean;
};

const IDLE_SCALE = 1.05;
const AT_RISK_SCALE = 1.12;

export function StreakBadge({ atRisk, count }: StreakBadgeProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }

    const to = atRisk ? AT_RISK_SCALE : IDLE_SCALE;
    const duration = atRisk ? theme.motion.pulseAtRisk : theme.motion.pulse;
    scale.value = withRepeat(withTiming(to, { duration }), -1, true);

    return () => {
      cancelAnimation(scale);
      scale.value = 1;
    };
  }, [atRisk, reducedMotion, scale, theme.motion.pulse, theme.motion.pulseAtRisk]);

  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      accessibilityLabel={`${count} day streak${atRisk ? ', log today to keep it' : ''}`}
      accessibilityRole="text"
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.colors.tintStreak,
          borderRadius: theme.radius.pill,
          flexDirection: 'row',
          gap: theme.space.xs,
          paddingHorizontal: theme.space.md,
          paddingVertical: theme.space.sm,
        },
        pulse,
      ]}
    >
      <Icon color="streak" name="flame" size={theme.type.size.subtitle} />
      <Text variant="label" color="textPrimary">
        {count}
      </Text>
    </Animated.View>
  );
}
