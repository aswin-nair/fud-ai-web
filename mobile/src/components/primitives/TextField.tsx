import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/theme/useTheme';

export type TextFieldProps = TextInputProps & {
  label?: string;
  suffix?: string;
  /** Shown beneath in textSecondary. Never styled as an error state. */
  hint?: string;
};

const FIELD_HEIGHT = 52;

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, suffix, hint, style, accessibilityLabel, accessibilityHint, ...rest },
  ref,
) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs }}>
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          height: FIELD_HEIGHT,
          paddingHorizontal: theme.space.lg,
        }}
      >
        <TextInput
          accessibilityHint={accessibilityHint ?? hint}
          accessibilityLabel={accessibilityLabel ?? label ?? rest.placeholder ?? 'Text input'}
          placeholderTextColor={theme.colors.textMuted}
          ref={ref}
          style={[
            {
              color: theme.colors.textPrimary,
              flex: 1,
              fontFamily: theme.type.body,
              fontSize: theme.type.size.subtitle,
            },
            style,
          ]}
          {...rest}
        />
        {suffix ? (
          <Text variant="body" color="textMuted">
            {suffix}
          </Text>
        ) : null}
      </View>

      {hint ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
