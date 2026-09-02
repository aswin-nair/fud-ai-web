import { useRef } from 'react';
import { Alert, Pressable, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { type Macros } from '@/components/domain/MacroGroup';
import { Icon } from '@/components/icons/Icon';
import { Text } from '@/components/primitives/Text';
import { type ColorToken } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export type MealRowProps = {
  name: string;
  portion: string;
  calories: number;
  macros: Macros;
  onEdit?: () => void;
  onDelete?: () => void;
};

const DOT_SIZE = 6;
const ACTION_WIDTH = 72;

export function MealRow({ name, portion, calories, macros, onEdit, onDelete }: MealRowProps) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  function close() {
    swipeable.current?.close();
  }

  function confirmDelete() {
    Alert.alert('Delete this entry?', `${name} will be removed from today's log.`, [
      { text: 'Cancel', style: 'cancel', onPress: close },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          close();
          onDelete?.();
        },
      },
    ]);
  }

  function renderActions() {
    return (
      <View style={{ flexDirection: 'row' }}>
        <Action
          background="track"
          icon="pencil"
          iconColor="textSecondary"
          label="Edit"
          onPress={() => {
            close();
            onEdit?.();
          }}
        />
        <Action
          background="danger"
          icon="trash"
          iconColor="textOnDanger"
          label="Delete"
          onPress={confirmDelete}
        />
      </View>
    );
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      ref={swipeable}
      renderRightActions={renderActions}
      rightThreshold={ACTION_WIDTH / 2}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          flexDirection: 'row',
          gap: theme.space.md,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
        }}
      >
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text variant="body" color="textPrimary" numberOfLines={1}>
            {name}
          </Text>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.space.sm }}>
            <Text variant="caption" color="textMuted">
              {portion}
            </Text>
            <MacroDot color="protein" grams={macros.protein} />
            <MacroDot color="carbs" grams={macros.carbs} />
            <MacroDot color="fat" grams={macros.fat} />
          </View>
        </View>

        <Text variant="label" color="textSecondary">
          {Math.round(calories)} kcal
        </Text>
      </View>
    </ReanimatedSwipeable>
  );
}

function MacroDot({ color, grams }: { color: ColorToken; grams: number }) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.space.xs }}>
      <View
        style={{
          backgroundColor: theme.colors[color],
          borderRadius: theme.radius.pill,
          height: DOT_SIZE,
          width: DOT_SIZE,
        }}
      />
      <Text variant="caption" color="textMuted">
        {Math.round(grams)}g
      </Text>
    </View>
  );
}

function Action({
  background,
  icon,
  iconColor,
  label,
  onPress,
}: {
  background: ColorToken;
  icon: 'pencil' | 'trash';
  iconColor: ColorToken;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors[background],
        gap: theme.space.xs,
        justifyContent: 'center',
        width: ACTION_WIDTH,
      }}
    >
      <Icon color={iconColor} name={icon} />
      <Text variant="caption" color={iconColor}>
        {label}
      </Text>
    </Pressable>
  );
}
