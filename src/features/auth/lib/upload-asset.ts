/**
 * Normalizes gallery picks for React Native multipart uploads.
 */

import { Platform } from 'react-native';

import type { PickedAsset } from '@/features/auth/types/register-form';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * Maps picker MIME quirks to backend-allowed types.
 */
export function normalizeUploadMime(
  type: string | undefined,
  fileName: string | undefined,
): string {
  const raw = String(type || '')
    .trim()
    .toLowerCase();

  if (raw === 'image/jpg' || raw === 'image/pjpeg') {
    return 'image/jpeg';
  }

  if (raw && raw !== 'image' && raw !== 'application/octet-stream') {
    return raw;
  }

  const ext = String(fileName || '')
    .split('.')
    .pop()
    ?.toLowerCase();

  if (ext && MIME_BY_EXT[ext]) {
    return MIME_BY_EXT[ext];
  }

  return 'image/jpeg';
}

/**
 * Ensures the multipart filename has an extension matching the MIME type.
 */
export function ensureUploadFileName(
  fileName: string | undefined,
  field: string,
  mime: string,
): string {
  const base = String(fileName || field)
    .trim()
    .replace(/[^\w.\-()+ ]+/g, '_')
    .replace(/\s+/g, '_');

  if (/\.[a-z0-9]+$/i.test(base)) {
    return base;
  }

  if (mime === 'image/png') {
    return `${base || field}.png`;
  }
  if (mime === 'image/webp') {
    return `${base || field}.webp`;
  }
  if (mime === 'application/pdf') {
    return `${base || field}.pdf`;
  }

  return `${base || field}.jpg`;
}

/**
 * Android paths without a scheme must be prefixed for NetworkingModule.
 */
export function normalizeUploadUri(uri: string): string {
  const trimmed = String(uri || '').trim();
  if (!trimmed) {
    return trimmed;
  }

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://') ||
    trimmed.startsWith('assets-library://')
  ) {
    return trimmed;
  }

  if (Platform.OS === 'android' && trimmed.startsWith('/')) {
    return `file://${trimmed}`;
  }

  return trimmed;
}

/**
 * Builds the RN FormData file part expected by the native networking stack.
 */
export function toMultipartFilePart(
  asset: PickedAsset,
  field: string,
): { uri: string; type: string; name: string } {
  const type = normalizeUploadMime(asset.type, asset.name);
  const name = ensureUploadFileName(asset.name, field, type);
  const uri = normalizeUploadUri(asset.uri);

  return { uri, type, name };
}

/**
 * True when the MIME is allowed by the BIGB upload filter.
 */
export function isAllowedUploadMime(mime: string): boolean {
  return (
    mime === 'image/jpeg' ||
    mime === 'image/png' ||
    mime === 'image/webp' ||
    mime === 'application/pdf'
  );
}
