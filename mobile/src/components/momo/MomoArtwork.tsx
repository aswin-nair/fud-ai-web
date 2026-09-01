import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const SOURCE_ASPECT_RATIO = 1408 / 768;
const ART_SCALE = 1.35;

export type MomoArtworkProps = {
  size: number;
};

/**
 * Shared raster body for Momo.
 *
 * This is intentionally isolated so the temporary MascotVibe preview can be
 * replaced with a production export without changing any mascot behaviour.
 */
export function MomoArtwork({ size }: MomoArtworkProps) {
  const artworkHeight = size * ART_SCALE;
  const artworkWidth = artworkHeight * SOURCE_ASPECT_RATIO;

  return (
    <View pointerEvents="none" style={[styles.frame, { height: size, width: size }]}>
      <Image
        accessible={false}
        contentFit="contain"
        source={require('../../../assets/images/mascotvibe-momo-preview-watermarked.png')}
        style={{
          height: artworkHeight,
          left: (size - artworkWidth) / 2,
          position: 'absolute',
          top: (size - artworkHeight) / 2,
          width: artworkWidth,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
