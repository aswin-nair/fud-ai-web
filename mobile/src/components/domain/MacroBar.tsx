import { View } from 'react-native';

import { ProgressBar } from '@/components/primitives/ProgressBar';
import { Text } from '@/components/primitives/Text';
import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type MacroBarProps = {
  label: string;
  consumed: number;
  target: number;
  color: ColorToken;
};

const BAR_HEIGHT = 8;

export function MacroBar({ label, consumed, target, color }: MacroBarProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
        <Text variant="label" color="textMuted">
          {Math.round(consumed)}/{Math.round(target)}g
        </Text>
      </View>
      <ProgressBar
        color={color}
        height={BAR_HEIGHT}
        max={target}
        overflowColor="onTrackSoft"
        value={consumed}
      />
    </View>
  );
}
