import { View } from 'react-native';

import { MacroBar } from '@/components/domain/MacroBar';
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

export function MacroGroup({ consumed, target }: MacroGroupProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.md }}>
      <MacroBar
        color="protein"
        consumed={consumed.protein}
        label="Protein"
        target={target.protein}
      />
      <MacroBar color="carbs" consumed={consumed.carbs} label="Carbs" target={target.carbs} />
      <MacroBar color="fat" consumed={consumed.fat} label="Fat" target={target.fat} />
    </View>
  );
}
