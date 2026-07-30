/**
 * Resolves backend-hosted upload paths for mobile image previews.
 */

import { API_BASE_URL } from '@/shared/api/client';

const UPLOAD_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/i, '');

/**
 * Turns `/uploads/...` into an absolute URL, or null when missing.
 */
export function resolveUploadUrl(
  path: string | undefined | null,
): string | null {
  if (!path) {
    return null;
  }

  const trimmed = String(path).trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${UPLOAD_ORIGIN}${normalized}`;
}
