import { View } from 'react-native';

import { MacroBar } from '@/components/domain/MacroBar';
import { MACRO_STAGGER_MS } from '@/feel/motion';
import { useTheme } from '@/theme/useTheme';

export type Macros = {
  protein: number;
  carbs: number;
  fat: number;
};

export type MacroGroupProps = {
  consumed: Macros;
  target: Macros;
};

/**
 * The three bars fill MACRO_STAGGER_MS apart rather than together — §11.3.
 * Simultaneous fills read as one block moving; a stagger reads as three
 * separate facts arriving.
 */
export function MacroGroup({ consumed, target }: MacroGroupProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.md }}>
      <MacroBar
        color="protein"
        consumed={consumed.protein}
        delay={0}
        label="Protein"
        target={target.protein}
      />
      <MacroBar
        color="carbs"
        consumed={consumed.carbs}
        delay={MACRO_STAGGER_MS}
        label="Carbs"
        target={target.carbs}
      />
      <MacroBar
        color="fat"
        consumed={consumed.fat}
        delay={MACRO_STAGGER_MS * 2}
        label="Fat"
        target={target.fat}
      />
    </View>
  );
}
