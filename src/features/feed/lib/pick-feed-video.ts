/**
 * Gallery / camera pick for Reels (feed `type: video`).
 */

import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

import {
  ensureUploadFileName,
  isAllowedVideoMime,
  normalizeUploadMime,
  normalizeUploadUri,
} from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_REEL_SECONDS = 300;

export type PickedVideo = PickedAsset & {
  durationSec?: number;
  fileSize?: number;
};

function fromPickerAsset(
  asset: {
    uri?: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  } | undefined,
  cancelled: boolean | undefined,
): PickedVideo | null {
  if (cancelled || !asset?.uri) {
    return null;
  }

  const type = normalizeUploadMime(asset.type, asset.fileName);
  if (!isAllowedVideoMime(type)) {
    return null;
  }
  if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    return null;
  }
  if (asset.duration && asset.duration > MAX_REEL_SECONDS) {
    return null;
  }

  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'reel', type),
    durationSec: asset.duration,
    fileSize: asset.fileSize,
  };
}

/**
 * One video from the library for a Prep Reel.
 */
export async function pickReelVideo(): Promise<PickedVideo | null> {
  const result = await launchImageLibrary({
    mediaType: 'video',
    selectionLimit: 1,
    videoQuality: 'high',
  });
  return fromPickerAsset(result.assets?.[0], result.didCancel);
}

/**
 * Record a short clip with the camera.
 */
export async function recordReelVideo(): Promise<PickedVideo | null> {
  const result = await launchCamera({
    mediaType: 'video',
    videoQuality: 'high',
    durationLimit: MAX_REEL_SECONDS,
  });
  return fromPickerAsset(result.assets?.[0], result.didCancel);
}

/**
 * Photo or video for a 24h story (Day Brief).
 */
export async function pickStoryMedia(): Promise<PickedAsset | null> {
  const result = await launchImageLibrary({
    mediaType: 'mixed',
    selectionLimit: 1,
    quality: 0.8,
    videoQuality: 'high',
  });
  const asset = result.assets?.[0];
  if (result.didCancel || !asset?.uri) {
    return null;
  }
  const type = normalizeUploadMime(asset.type, asset.fileName);
  const ok =
    type.startsWith('image/')
      ? type === 'image/jpeg' || type === 'image/png' || type === 'image/webp'
      : isAllowedVideoMime(type);
  if (!ok) {
    return null;
  }
  if (type.startsWith('video/') && asset.duration && asset.duration > 60) {
    return null;
  }
  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'story', type),
  };
}
