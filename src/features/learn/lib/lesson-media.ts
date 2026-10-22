/**
 * Resolve gated lesson media. Never hotlink `/uploads/courses/*.mp4`.
 */

import { API_BASE_URL } from '@/shared/api/client';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';
import type { LessonDetails } from '@/features/learn/types/course.types';

export type LessonMediaKind = 'youtube' | 'video' | 'none';

function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

export function youtubeVideoId(url: string | null | undefined): string | null {
  const value = String(url || '').trim();
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeWatchUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function youtubeThumb(url: string | null | undefined): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function detectLessonMediaKind(url: string | null | undefined): LessonMediaKind {
  const value = String(url || '').trim();
  if (!value) {
    return 'none';
  }
  if (isYoutube(value)) {
    return 'youtube';
  }
  if (
    /\.(mp4|webm|mov|m4v|m3u8)(\?|$)/i.test(value) ||
    value.includes('/stream') ||
    /^https?:\/\//i.test(value)
  ) {
    return 'video';
  }
  return 'none';
}

function toAbsoluteApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * Prefer signed stream. Fall back to YouTube / non-course remote URLs only.
 */
export function resolveLessonPlaybackSrc(lesson: LessonDetails): string {
  if (lesson.streamUrl) {
    return toAbsoluteApiPath(lesson.streamUrl);
  }
  const raw = String(lesson.videoUrl || lesson.videoPath || '').trim();
  if (!raw) {
    return '';
  }
  if (isYoutube(raw)) {
    return raw;
  }
  if (raw.startsWith('/uploads/courses/')) {
    return '';
  }
  return resolveUploadUrl(raw) || raw;
}

export function resolveCaptionSrc(lesson: LessonDetails): string | null {
  if (!lesson.captionUrl) {
    return null;
  }
  return toAbsoluteApiPath(lesson.captionUrl);
}

export function htmlToPlain(html: string | undefined): string {
  if (!html) {
    return '';
  }
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
