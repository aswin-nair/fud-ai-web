import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export type Option<T extends string> = {
  value: T;
  label: string;
  detail?: string;
};

export type OptionListProps<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

/** A vertical single-select. One question per screen wants a big tap target. */
export function OptionList<T extends string>({
  options,
  value,
  onChange,
}: OptionListProps<T>) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.sm }}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              alignItems: 'center',
              backgroundColor: selected ? theme.colors.tintOnTrack : theme.colors.surface,
              borderColor: selected ? theme.colors.onTrack : theme.colors.border,
              borderRadius: theme.radius.md,
              borderWidth: selected ? StyleSheet.hairlineWidth * 2 : StyleSheet.hairlineWidth,
              flexDirection: 'row',
              gap: theme.space.md,
              padding: theme.space.lg,
            }}
          >
            <View style={{ flex: 1, gap: theme.space.xs }}>
              <Text variant="subtitle">{option.label}</Text>
              {option.detail ? (
                <Text variant="caption" color="textSecondary">
                  {option.detail}
                </Text>
              ) : null}
            </View>

            {selected ? <Icon color="onTrack" name="check" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
