import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { type ColorToken, type TrackingToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'label'
  | 'caption';

/**
 * Font properties are owned by the type scale, so callers cannot override them
 * through `style`. Layout properties such as margin stay available.
 */
type FontProperty =
  | 'color'
  | 'fontFamily'
  | 'fontSize'
  | 'fontStyle'
  | 'fontVariant'
  | 'fontWeight'
  | 'letterSpacing'
  | 'lineHeight';

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TextVariant;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
  tracking?: TrackingToken;
  style?: Omit<TextStyle, FontProperty>;
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  tracking,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  // Fredoka carries headlines and numbers, Nunito Sans carries reading text.
  const family = {
    hero: theme.type.display,
    display: theme.type.display,
    title: theme.type.title,
    subtitle: theme.type.title,
    body: theme.type.body,
    label: theme.type.bodyBold,
    caption: theme.type.body,
  }[variant];

  return (
    <RNText
      style={[
        {
          color: theme.colors[color],
          fontFamily: family,
          fontSize: theme.type.size[variant],
          textAlign: align,
          letterSpacing: tracking ? theme.type.tracking[tracking] : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
