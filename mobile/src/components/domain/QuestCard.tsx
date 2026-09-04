import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Confetti } from '@/components/domain/Confetti';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Card, type CardTint } from '@/components/primitives/Card';
import { ProgressBar } from '@/components/primitives/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type QuestCardProps = {
  title: string;
  icon: IconName;
  current: number;
  goal: number;
  tint?: CardTint;
  color?: ColorToken;
};

const POP_SCALE = 1.05;

export function QuestCard({
  title,
  icon,
  current,
  goal,
  tint = 'onTrack',
  color = 'onTrack',
}: QuestCardProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const complete = current >= goal;

  // A quest already finished when the card mounts was celebrated in an earlier
  // session. Only a fresh transition into completion earns confetti.
  const celebrated = useRef(complete);
  const [bursting, setBursting] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!complete) {
      celebrated.current = false;
      return;
    }
    if (celebrated.current) return;

    celebrated.current = true;

    if (reducedMotion) return;

    const startTimer = setTimeout(() => {
      setBursting(true);
      scale.value = withSequence(
        withTiming(POP_SCALE, { duration: theme.motion.press }),
        withTiming(1, { duration: theme.motion.press }),
      );
    }, 0);
    const endTimer = setTimeout(() => setBursting(false), theme.motion.celebrate);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [complete, reducedMotion, scale, theme.motion.celebrate, theme.motion.press]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={pop}>
      <Card tint={tint} style={{ gap: theme.space.md, overflow: 'hidden' }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.space.sm }}>
          <Icon color={complete ? 'onTrack' : color} name={complete ? 'check' : icon} />
          <Text variant="label" color="textPrimary" style={{ flex: 1 }}>
            {title}
          </Text>
          <Text variant="label" color="textSecondary">
            {Math.min(current, goal)}/{goal}
          </Text>
        </View>

        <ProgressBar accessibilityLabel={`${title} progress`} color={color} max={goal} value={current} />

        <Confetti fire={bursting} />
      </Card>
    </Animated.View>
  );
}
