import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

export type SheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
};

const BACKDROP_OPACITY = 0.4;

/**
 * Mounts only while open, so the open animation runs from mount and the sheet
 * never intercepts touches while closed. Height comes from the content.
 */
export function Sheet({ visible, onDismiss, children }: SheetProps) {
  const theme = useTheme();

  const animationConfigs = useBottomSheetTimingConfigs({ duration: theme.motion.sheet });

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={BACKDROP_OPACITY}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <BottomSheet
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
        }}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
        index={0}
        onClose={onDismiss}
      >
        <BottomSheetView
          style={{
            gap: theme.space.md,
            paddingBottom: theme.space.xxl,
            paddingHorizontal: theme.space.lg,
            paddingTop: theme.space.sm,
          }}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
