/**
 * Gallery / camera pick for Reels (feed `type: video`) and Day Brief stories.
 */

import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import {
  ensureUploadFileName,
  isAllowedVideoMime,
  normalizeUploadMime,
  normalizeUploadUri,
} from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { MediaPickError } from '@/features/feed/lib/pick-feed-image';
import { ensureCameraPermission } from '@/shared/lib/camera-permission';

const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_REEL_SECONDS = 300;
const MAX_STORY_VIDEO_SECONDS = 60;
export const MAX_STORY_ITEMS = 10;

export type PickedVideo = PickedAsset & {
  durationSec?: number;
  fileSize?: number;
};

function assertNoPickerError(result: ImagePickerResponse): void {
  if (!result.errorCode) {
    return;
  }
  if (result.errorCode === 'camera_unavailable') {
    throw new MediaPickError('No camera is available on this device.');
  }
  if (result.errorCode === 'permission') {
    throw new MediaPickError('Allow camera and photo access for BIGB in Settings.');
  }
  throw new MediaPickError(result.errorMessage || 'Could not open the picker.');
}

function toReelVideo(asset: Asset | undefined): PickedVideo {
  if (!asset?.uri) {
    throw new MediaPickError('Could not read that video. Try another one.');
  }
  const type = normalizeUploadMime(asset.type, asset.fileName);
  if (!isAllowedVideoMime(type)) {
    throw new MediaPickError('Use an MP4 or MOV video.');
  }
  if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
    throw new MediaPickError('That video is over 250 MB. Pick a shorter clip.');
  }
  if (asset.duration && asset.duration > MAX_REEL_SECONDS) {
    throw new MediaPickError('Reels can be up to 5 minutes long.');
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
 * One video from the library for a Prep Reel. Null when cancelled.
 */
export async function pickReelVideo(): Promise<PickedVideo | null> {
  const result = await launchImageLibrary({
    mediaType: 'video',
    selectionLimit: 1,
    videoQuality: 'high',
  });
  if (result.didCancel) {
    return null;
  }
  assertNoPickerError(result);
  return toReelVideo(result.assets?.[0]);
}

/**
 * Record a clip with the camera. Null when cancelled or permission denied.
 */
export async function recordReelVideo(): Promise<PickedVideo | null> {
  if (!(await ensureCameraPermission())) {
    return null;
  }
  const result = await launchCamera({
    mediaType: 'video',
    videoQuality: 'high',
    durationLimit: MAX_REEL_SECONDS,
    saveToPhotos: false,
  });
  if (result.didCancel) {
    return null;
  }
  assertNoPickerError(result);
  return toReelVideo(result.assets?.[0]);
}

function toStoryAsset(asset: Asset): PickedAsset | null {
  if (!asset.uri) {
    return null;
  }
  const type = normalizeUploadMime(asset.type, asset.fileName);
  const ok = type.startsWith('image/')
    ? type === 'image/jpeg' || type === 'image/png' || type === 'image/webp'
    : isAllowedVideoMime(type);
  if (!ok) {
    return null;
  }
  if (type.startsWith('video/') && asset.duration && asset.duration > MAX_STORY_VIDEO_SECONDS) {
    return null;
  }
  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'story', type),
  };
}

/**
 * Photos / short videos for stories — each becomes its own 24h story.
 * Returns `skipped` for items that were too long or an unsupported type.
 */
export async function pickStoryMediaList(
  limit = MAX_STORY_ITEMS,
): Promise<{ items: PickedAsset[]; skipped: number }> {
  if (limit <= 0) {
    return { items: [], skipped: 0 };
  }
  const result = await launchImageLibrary({
    mediaType: 'mixed',
    selectionLimit: limit,
    quality: 0.8,
    videoQuality: 'high',
  });
  if (result.didCancel) {
    return { items: [], skipped: 0 };
  }
  assertNoPickerError(result);
  const assets = result.assets ?? [];
  const items = assets
    .map(toStoryAsset)
    .filter((item): item is PickedAsset => item !== null)
    .slice(0, limit);
  return { items, skipped: assets.length - items.length };
}

/**
 * Photo or video for a 24h story (Day Brief).
 */
export async function pickStoryMedia(): Promise<PickedAsset | null> {
  const { items } = await pickStoryMediaList(1);
  return items[0] ?? null;
}
