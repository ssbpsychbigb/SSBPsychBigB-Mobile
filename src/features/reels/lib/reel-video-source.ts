/**
 * Resolves a playable video source for the current platform.
 */

import { Image } from 'react-native';
import type { ReactVideoSource } from 'react-native-video';

/**
 * Metro `require()` id → `{ uri }` that ExoPlayer / AVPlayer can load.
 */
export function getReelVideoSource(video: number): ReactVideoSource {
  const resolved = Image.resolveAssetSource(video);
  return { uri: resolved?.uri ?? '' };
}
