import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Base = {
  label: string;
  detail?: string;
  tone?: ColorToken;
};

export type SettingRowProps = Base &
  (
    | { kind: 'navigate'; onPress: () => void }
    | { kind: 'toggle'; value: boolean; onValueChange: (value: boolean) => void }
    | { kind: 'value'; value: string }
  );

export function SettingRow(props: SettingRowProps) {
  const theme = useTheme();
  const tone = props.tone ?? 'textPrimary';

  const body = (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: theme.colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        gap: theme.space.md,
        paddingHorizontal: theme.space.lg,
        paddingVertical: theme.space.lg,
      }}
    >
      <View style={{ flex: 1, gap: theme.space.xs }}>
        <Text color={tone} variant="body">
          {props.label}
        </Text>
        {props.detail ? (
          <Text color="textMuted" variant="caption">
            {props.detail}
          </Text>
        ) : null}
      </View>

      {props.kind === 'navigate' ? (
        <Icon color="textMuted" name="chevronRight" size={theme.type.size.subtitle} />
      ) : null}

      {props.kind === 'value' ? (
        <Text color="textSecondary" variant="body">
          {props.value}
        </Text>
      ) : null}

      {props.kind === 'toggle' ? (
        <Switch
          accessibilityHint={props.detail}
          accessibilityLabel={props.label}
          accessibilityState={{ checked: props.value }}
          onValueChange={props.onValueChange}
          thumbColor={theme.colors.surface}
          trackColor={{ false: theme.colors.track, true: theme.colors.onTrack }}
          value={props.value}
        />
      ) : null}
    </View>
  );

  if (props.kind === 'navigate') {
    return (
      <Pressable
        accessibilityHint={props.detail}
        accessibilityLabel={props.label}
        accessibilityRole="button"
        onPress={props.onPress}
      >
        {body}
      </Pressable>
    );
  }

  return body;
}
