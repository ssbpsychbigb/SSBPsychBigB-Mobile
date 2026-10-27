/**
 * Swipeable photo row for a post — one photo stays a single image.
 */

import { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ms, s, vs } from '@/shared/lib/responsive';
import { AppText } from '@/shared/ui';

export type FeedMediaCarouselProps = {
  uris: string[];
  onPress?: (index: number) => void;
};

export function FeedMediaCarousel({ uris, onPress }: FeedMediaCarouselProps) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  if (uris.length <= 1) {
    const only = uris[0];
    if (!only) {
      return null;
    }
    return (
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={() => onPress?.(0)}>
        <Image source={{ uri: only }} style={styles.media} />
      </Pressable>
    );
  }

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) {
      return;
    }
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.min(uris.length - 1, Math.max(0, next)));
  };

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setWidth((current) => (current === next ? current : next));
      }}>
      <ScrollView
        decelerationRate="fast"
        horizontal
        onMomentumScrollEnd={onScrollEnd}
        pagingEnabled
        showsHorizontalScrollIndicator={false}>
        {uris.map((uri) => (
          <Pressable
            accessibilityRole={onPress ? 'link' : undefined}
            disabled={!onPress}
            key={uri}
            onPress={() => onPress?.(uris.indexOf(uri))}
            style={{ width: width || undefined }}>
            <Image source={{ uri }} style={[styles.media, width ? { width } : null]} />
          </Pressable>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={styles.counter}>
        <AppText style={styles.counterText} variant="caption" weight="semibold">
          {index + 1}/{uris.length}
        </AppText>
      </View>
      <View pointerEvents="none" style={styles.dots}>
        {uris.map((uri, dot) => (
          <View key={uri} style={[styles.dot, dot === index ? styles.dotOn : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    height: vs(240),
    backgroundColor: '#0F172A',
  },
  counter: {
    position: 'absolute',
    top: vs(10),
    right: s(10),
    borderRadius: ms(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  counterText: {
    color: '#FFFFFF',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: vs(10),
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(5),
  },
  dot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotOn: {
    backgroundColor: '#FFFFFF',
    width: ms(14),
  },
});
