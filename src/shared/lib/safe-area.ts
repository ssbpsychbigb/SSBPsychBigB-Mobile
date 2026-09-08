/**
 * Status-bar inset that still works when Android reports 0 with a translucent bar.
 */

import { Platform, StatusBar } from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { vs } from '@/shared/lib/responsive';

/**
 * Small gap between status-bar icons and the first header row.
 */
export const SCREEN_TOP_GAP = vs(4);

const ANDROID_FALLBACK_TOP = 24;
const IOS_FALLBACK_TOP = 47;

export type SafeTopInsetInput = {
  insetsTop: number;
  androidStatusBarHeight: number;
  windowMetricsTop: number;
  platform: typeof Platform.OS;
};

/**
 * Picks the largest reliable top inset so headers never sit on system icons.
 */
export function resolveSafeTopInset({
  insetsTop,
  androidStatusBarHeight,
  windowMetricsTop,
  platform,
}: SafeTopInsetInput): number {
  const raw = Math.max(
    insetsTop,
    windowMetricsTop,
    platform === 'android' ? androidStatusBarHeight : 0,
  );
  if (raw > 0) {
    return raw;
  }
  return platform === 'android' ? ANDROID_FALLBACK_TOP : IOS_FALLBACK_TOP;
}

/**
 * Raw status-bar / notch height (no extra breathing room).
 */
export function useSafeTopInset(): number {
  const insets = useSafeAreaInsets();
  const androidBar =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const fromMetrics = initialWindowMetrics?.insets.top ?? 0;
  return resolveSafeTopInset({
    androidStatusBarHeight: androidBar,
    insetsTop: insets.top,
    platform: Platform.OS,
    windowMetricsTop: fromMetrics,
  });
}

/**
 * Top padding for Screen scaffolds so headers never sit on the status bar.
 */
export function useScreenTopPadding(gap: number = SCREEN_TOP_GAP): number {
  return useSafeTopInset() + gap;
}
