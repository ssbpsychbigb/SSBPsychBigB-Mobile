/**
 * Gallery / camera pick for feed posts and Day Briefs.
 */

import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import {
  ensureUploadFileName,
  isAllowedUploadMime,
  normalizeUploadMime,
  normalizeUploadUri,
} from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { ensureCameraPermission } from '@/shared/lib/camera-permission';

export const MAX_POST_IMAGES = 10;

const PHOTO_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.8 as const,
  maxWidth: 1600,
  maxHeight: 1600,
};

export class MediaPickError extends Error {}

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

function toPhotoAsset(asset: Asset | undefined): PickedAsset | null {
  if (!asset?.uri) {
    return null;
  }
  const type = normalizeUploadMime(asset.type, asset.fileName);
  if (!isAllowedUploadMime(type) || !type.startsWith('image/')) {
    return null;
  }
  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'media', type),
  };
}

/**
 * Returns a normalized JPEG/PNG/WebP asset, or null if the user cancelled.
 */
export async function pickFeedImage(): Promise<PickedAsset | null> {
  try {
    const [first] = await pickFeedImages(1);
    return first ?? null;
  } catch {
    return null;
  }
}

/**
 * Up to `limit` photos in the order the user picked them. Empty when cancelled.
 */
export async function pickFeedImages(limit = MAX_POST_IMAGES): Promise<PickedAsset[]> {
  if (limit <= 0) {
    return [];
  }
  const result = await launchImageLibrary({ ...PHOTO_OPTIONS, selectionLimit: limit });
  if (result.didCancel) {
    return [];
  }
  assertNoPickerError(result);
  return (result.assets ?? [])
    .map(toPhotoAsset)
    .filter((item): item is PickedAsset => item !== null)
    .slice(0, limit);
}

/**
 * Opens the camera for one photo. Null when cancelled or permission denied.
 */
export async function captureFeedPhoto(): Promise<PickedAsset | null> {
  if (!(await ensureCameraPermission())) {
    return null;
  }
  const result = await launchCamera({ ...PHOTO_OPTIONS, saveToPhotos: false });
  if (result.didCancel) {
    return null;
  }
  assertNoPickerError(result);
  return toPhotoAsset(result.assets?.[0]);
}
