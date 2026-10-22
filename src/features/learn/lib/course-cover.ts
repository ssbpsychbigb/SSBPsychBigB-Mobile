/**
 * App-bundled course covers. JPEG files live in the app; they are not loaded from the website.
 */

import type { ImageSourcePropType } from 'react-native';

import { youtubeThumb } from '@/features/learn/lib/lesson-media';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

const BUNDLED_COURSE_COVERS: Record<string, number> = {
  'afcat-current-affairs-capsule': require('../../../shared/assets/course-covers/afcat-current-affairs-capsule.jpg'),
  'bigb-orientation': require('../../../shared/assets/course-covers/bigb-orientation.jpg'),
  'cds-english-comprehension': require('../../../shared/assets/course-covers/cds-english-comprehension.jpg'),
  'nda-mathematics-foundations': require('../../../shared/assets/course-covers/nda-mathematics-foundations.jpg'),
  'ssb-interview-mastery-day-1-foundations': require('../../../shared/assets/course-covers/ssb-interview-mastery-day-1-foundations.jpg'),
  'ssb-psychology-olq-intro': require('../../../shared/assets/course-covers/ssb-psychology-olq-intro.jpg'),
};

export type CourseCoverInput = {
  coverPath?: string | null;
  previewVideoUrl?: string | null;
  slug?: string | null;
};

export function slugFromCourseCoverPath(
  path: string | null | undefined,
): string | null {
  const match = String(path || '')
    .trim()
    .match(/\/course-covers\/([^/?#]+)\.(jpe?g|png|webp)$/i);
  const slug = match?.[1]?.trim();
  return slug || null;
}

function bundledCover(slug: string | null): number | null {
  if (!slug) {
    return null;
  }
  return BUNDLED_COURSE_COVERS[slug] ?? null;
}

/**
 * Local JPEG first (by slug), then a real API upload, then YouTube thumb.
 */
export function courseCoverSource(
  input: CourseCoverInput,
): ImageSourcePropType | null {
  const cover = String(input.coverPath || '').trim();
  const local =
    bundledCover(slugFromCourseCoverPath(cover)) ||
    bundledCover(String(input.slug || '').trim());
  if (local) {
    return local;
  }

  if (cover && !cover.includes('/course-covers/')) {
    const uploaded = resolveUploadUrl(cover);
    if (uploaded) {
      return { uri: uploaded };
    }
  }

  const thumb = youtubeThumb(input.previewVideoUrl);
  return thumb ? { uri: thumb } : null;
}
