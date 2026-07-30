/**
 * App-wide responsive scaling (react-native-size-matters).
 *
 * Baseline: ~375×812 design (iPhone-class). Develop once, scale everywhere.
 *
 * | Helper | Use for |
 * |--------|---------|
 * | `s` / `hs` | width, paddingHorizontal, marginHorizontal, left/right |
 * | `vs` | height, paddingVertical, marginVertical, top/bottom |
 * | `ms` | fontSize, icon size, borderRadius, gaps (gentler) |
 * | `mvs` | vertical-only moderate scaling |
 *
 * Prefer flex/% for layout structure; scale only fixed design numbers.
 * Do not scale hairline borders (use StyleSheet.hairlineWidth).
 */

import { PixelRatio } from 'react-native';
import {
  moderateScale,
  moderateVerticalScale,
  scale,
  verticalScale,
  ScaledSheet,
} from 'react-native-size-matters';

/** Horizontal / general scale (width-based). */
export const s = (size: number): number => scale(size);

/** Alias for horizontal scale. */
export const hs = s;

/** Vertical scale (height-based). */
export const vs = (size: number): number => verticalScale(size);

/**
 * Moderate scale — default factor 0.3 for fonts/radii (less aggressive on tablets).
 */
export const ms = (size: number, factor = 0.3): number =>
  moderateScale(size, factor);

/** Moderate vertical scale. */
export const mvs = (size: number, factor = 0.3): number =>
  moderateVerticalScale(size, factor);

/**
 * Font size that respects design scale and rounds to a clean pixel.
 */
export const fontSize = (size: number, factor = 0.3): number =>
  PixelRatio.roundToNearestPixel(ms(size, factor));

/**
 * Line height matched to a font size (1.4× default).
 */
export const lineHeight = (size: number, ratio = 1.4, factor = 0.3): number =>
  PixelRatio.roundToNearestPixel(ms(size, factor) * ratio);

export { ScaledSheet };

export const responsive = {
  s,
  hs,
  vs,
  ms,
  mvs,
  fontSize,
  lineHeight,
} as const;
