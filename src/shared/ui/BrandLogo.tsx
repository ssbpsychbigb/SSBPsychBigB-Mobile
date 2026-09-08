/**
 * Official BIGB horizontal lockup (icon + wordmark + tagline).
 */

import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { s, vs } from '@/shared/lib/responsive';

/** Native asset size — keep layout on this ratio so the lockup stays aligned. */
const LOCKUP_WIDTH = 1024;
const LOCKUP_HEIGHT = 303;
const LOCKUP_ASPECT = LOCKUP_WIDTH / LOCKUP_HEIGHT;

const SOURCE = require('../assets/brand/bigb-logo-full.png');

export type BrandLogoSize = 'header' | 'auth' | 'hero' | 'splash';

export type BrandLogoProps = {
  size?: BrandLogoSize;
  /** Horizontal alignment of the lockup in its row. */
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

const SIZE_SPEC: Record<BrandLogoSize, { height: number; maxWidth: number }> = {
  header: { height: vs(28), maxWidth: s(168) },
  auth: { height: vs(30), maxWidth: s(200) },
  hero: { height: vs(58), maxWidth: s(300) },
  splash: { height: vs(68), maxWidth: s(320) },
};

/**
 * Renders the official lockup at a fixed aspect ratio (`contain`, no crop).
 */
export function BrandLogo({
  size = 'auth',
  align = 'left',
  style,
}: BrandLogoProps) {
  const spec = SIZE_SPEC[size];
  let height = spec.height;
  let width = height * LOCKUP_ASPECT;
  if (width > spec.maxWidth) {
    width = spec.maxWidth;
    height = width / LOCKUP_ASPECT;
  }

  return (
    <View
      style={[
        styles.wrap,
        align === 'center' ? styles.center : styles.left,
        style,
      ]}>
      <Image
        accessibilityLabel="BIGB — Defence Exam Preparation & Social Platform"
        resizeMode="contain"
        source={SOURCE}
        style={{ width, height }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
  },
  left: {
    alignItems: 'flex-start',
  },
  center: {
    alignItems: 'center',
    alignSelf: 'center',
  },
});
