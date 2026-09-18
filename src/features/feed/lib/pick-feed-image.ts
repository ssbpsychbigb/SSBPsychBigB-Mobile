/**
 * Gallery pick for feed posts and Day Briefs.
 */

import { launchImageLibrary } from 'react-native-image-picker';

import {
  ensureUploadFileName,
  isAllowedUploadMime,
  normalizeUploadMime,
  normalizeUploadUri,
} from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';

/**
 * Returns a normalized JPEG/PNG/WebP asset, or null if the user cancelled.
 */
export async function pickFeedImage(): Promise<PickedAsset | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
    maxWidth: 1600,
    maxHeight: 1600,
  });

  const asset = result.assets?.[0];
  if (result.didCancel || !asset?.uri) {
    return null;
  }

  const type = normalizeUploadMime(asset.type, asset.fileName);
  if (!isAllowedUploadMime(type)) {
    return null;
  }

  return {
    uri: normalizeUploadUri(asset.uri),
    type,
    name: ensureUploadFileName(asset.fileName, 'media', type),
  };
}
