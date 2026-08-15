import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  motion,
  palette,
  radius,
  space,
  type,
  type ColorScheme,
  type Colors,
} from './tokens';

export type Theme = {
  scheme: ColorScheme;
  colors: Colors;
  type: typeof type;
  space: typeof space;
  radius: typeof radius;
  motion: typeof motion;
};

export const ThemeContext = createContext<Theme | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
  /** Pins the scheme regardless of the OS setting. For gallery and test use. */
  scheme?: ColorScheme;
};

export function ThemeProvider({ children, scheme: override }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(
    () => ({ scheme, colors: palette[scheme], type, space, radius, motion }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
