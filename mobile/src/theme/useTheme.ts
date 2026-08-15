import { useContext } from 'react';

import { ThemeContext, type Theme } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);

  if (theme === null) {
    throw new Error('useTheme must be called inside <ThemeProvider>.');
  }

  return theme;
}
