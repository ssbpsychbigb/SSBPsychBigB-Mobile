/**
 * Multipart helpers for club brand and files.
 */

import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';

/**
 * Backend expects the field name `file`.
 */
export function toCommunityFileForm(asset: PickedAsset): FormData {
  const formData = new FormData();
  formData.append('file', toMultipartFilePart(asset, 'file') as unknown as Blob);
  return formData;
}
