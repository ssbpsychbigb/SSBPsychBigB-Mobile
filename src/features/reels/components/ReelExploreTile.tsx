/**
 * Explore grid cell — portrait clip with muted preview, like Instagram Search.
 */

import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Play } from 'lucide-react-native';
import Video from 'react-native-video';

import type { PrepReelPreview } from '@/features/reels/data/reels-preview';
import { getReelVideoSource } from '@/features/reels/lib/reel-video-source';
import { fontSize, ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

export type ReelExploreTileProps = {
  reel: PrepReelPreview;
  size: number;
  onPress: () => void;
};

/**
 * Square-ish tile. Video stays paused so the grid does not autoplay audio.
 */
export function ReelExploreTile({ reel, size, onPress }: ReelExploreTileProps) {
  return (
    <Pressable
      accessibilityLabel={`${reel.title}. ${reel.likesLabel} likes`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: size, opacity: pressed ? 0.88 : 1 },
      ]}>
      <View style={[styles.fill, { backgroundColor: reel.color }]}>
        {reel.posterUri ? (
          <Image resizeMode="cover" source={{ uri: reel.posterUri }} style={StyleSheet.absoluteFill} />
        ) : (
          <Video
            disableFocus
            ignoreSilentSwitch="ignore"
            muted
            paused
            playInBackground={false}
            pointerEvents="none"
            repeat={false}
            resizeMode="cover"
            source={getReelVideoSource(reel)}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.scrim} />
        <View style={styles.playMark}>
          <Play color="#FFFFFF" fill="#FFFFFF" size={ms(14)} />
        </View>
        <View style={styles.meta}>
          <AppText color="inverse" numberOfLines={1} style={styles.likes} variant="caption" weight="semibold">
            {reel.likesLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  fill: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  playMark: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: s(1),
  },
  meta: {
    position: 'absolute',
    left: s(8),
    right: s(8),
    bottom: vs(8),
  },
  likes: {
    fontSize: fontSize(11),
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
