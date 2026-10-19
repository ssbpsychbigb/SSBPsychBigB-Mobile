/**
 * Resolves a playable video source for bundled assets or remote uploads.
 */

import { Image } from 'react-native';
import type { ReactVideoSource } from 'react-native-video';

import type { PrepReelPreview } from '@/features/reels/data/reels-preview';

/**
 * Live reels use `videoUri`. Bundled preview clips still use Metro `require()`.
 */
export function getReelVideoSource(reel: PrepReelPreview): ReactVideoSource {
  if (reel.videoUri) {
    return { uri: reel.videoUri };
  }
  if (typeof reel.video === 'number') {
    const resolved = Image.resolveAssetSource(reel.video);
    return { uri: resolved?.uri ?? '' };
  }
  return { uri: '' };
}
