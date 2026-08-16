import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Rendered after the value, e.g. "servings". */
  unit?: string;
};

const BUTTON = 44;

export function Stepper({
  value,
  onChange,
  step = 0.5,
  min = 0.5,
  max = 20,
  unit,
}: StepperProps) {
  const theme = useTheme();

  function nudge(direction: 1 | -1) {
    const next = Math.round((value + direction * step) * 100) / 100;
    if (next < min || next > max) return;

    void Haptics.selectionAsync();
    onChange(next);
  }

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: theme.space.sm,
      }}
    >
      <Step
        disabled={value - step < min}
        label="Decrease servings"
        onPress={() => nudge(-1)}
        symbol="minus"
      />

      <View style={{ alignItems: 'center' }}>
        <Text variant="display">{format(value)}</Text>
        {unit ? (
          <Text variant="caption" color="textMuted">
            {unit}
          </Text>
        ) : null}
      </View>

      <Step
        disabled={value + step > max}
        label="Increase servings"
        onPress={() => nudge(1)}
        symbol="plus"
      />
    </View>
  );
}

function Step({
  symbol,
  label,
  onPress,
  disabled,
}: {
  symbol: 'plus' | 'minus';
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.track,
        borderRadius: theme.radius.md,
        height: BUTTON,
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        width: BUTTON,
      }}
    >
      {symbol === 'plus' ? (
        <Icon color="textPrimary" name="plus" />
      ) : (
        <Minus />
      )}
    </Pressable>
  );
}

/** The icon set has no bare minus, and one glyph does not justify an entry. */
function Minus() {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.textPrimary,
        borderRadius: theme.radius.pill,
        height: 2,
        width: 13,
      }}
    />
  );
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
