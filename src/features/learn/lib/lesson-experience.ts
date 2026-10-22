/**
 * One classifier for a Udemy-style lesson stage: video, audio, PDF, article, live, quiz.
 * Source can be YouTube, signed stream, S3, Mongo uploads, or any https URL.
 */

import {
  htmlToPlain,
  youtubeVideoId,
  resolveCaptionSrc,
  resolveLessonPlaybackSrc,
} from '@/features/learn/lib/lesson-media';
import type { LessonDetails } from '@/features/learn/types/course.types';
import { API_BASE_URL } from '@/shared/api/client';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

export type LessonExperience =
  | { kind: 'quiz' }
  | { kind: 'live'; url: string }
  | { kind: 'article' }
  | { kind: 'pdf'; src: string }
  | { kind: 'youtube'; videoId: string }
  | { kind: 'audio'; src: string }
  | { kind: 'video'; src: string; captionSrc: string | null }
  | { kind: 'empty' };

const AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|opus|flac)(\?|$)/i;
const PDF_RE = /\.pdf(\?|$)/i;
const VIDEO_FILE_RE = /\.(mp4|webm|mov|m4v|mkv|m3u8)(\?|$)/i;

export function isAudioUrl(url: string): boolean {
  return AUDIO_RE.test(url) || /\/audio\//i.test(url);
}

export function isPdfUrl(url: string): boolean {
  return PDF_RE.test(url);
}

function toAbsolute(path: string): string {
  const trimmed = String(path || '').trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return (
    resolveUploadUrl(trimmed) ||
    `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
  );
}

function candidates(lesson: LessonDetails): string[] {
  const list = [
    lesson.streamUrl,
    lesson.videoUrl,
    lesson.videoPath,
    ...(lesson.resourcePaths || []),
  ];
  return list.map((item) => toAbsolute(String(item || ''))).filter(Boolean);
}

function isPlayableVideoUrl(url: string): boolean {
  if (!url || isAudioUrl(url) || isPdfUrl(url)) {
    return false;
  }
  return (
    VIDEO_FILE_RE.test(url) ||
    url.includes('/stream') ||
    /^https?:\/\//i.test(url)
  );
}

/**
 * Pick the in-app experience. A video lesson with PDF notes still plays video.
 */
export function resolveLessonExperience(
  lesson: LessonDetails,
): LessonExperience {
  const type = String(lesson.lessonType || '').toLowerCase();

  if (type === 'quiz') {
    return { kind: 'quiz' };
  }
  if (type === 'live_link') {
    return { kind: 'live', url: String(lesson.videoUrl || '').trim() };
  }

  const urls = candidates(lesson);
  const playback = resolveLessonPlaybackSrc(lesson);

  if (type === 'pdf') {
    const pdfHit = urls.find(isPdfUrl) || playback || urls[0] || '';
    if (pdfHit) {
      return { kind: 'pdf', src: pdfHit };
    }
    return { kind: 'article' };
  }

  if (type === 'text') {
    return { kind: 'article' };
  }

  const youtubeId = youtubeVideoId(lesson.videoUrl || playback);
  if (youtubeId && type !== 'audio') {
    return { kind: 'youtube', videoId: youtubeId };
  }

  if (type === 'audio' || isAudioUrl(playback)) {
    const audioSrc =
      (isAudioUrl(playback) ? playback : '') ||
      urls.find(isAudioUrl) ||
      playback ||
      urls[0] ||
      '';
    if (audioSrc) {
      return { kind: 'audio', src: audioSrc };
    }
  }

  if (playback && isPlayableVideoUrl(playback)) {
    return {
      kind: 'video',
      src: playback,
      captionSrc: resolveCaptionSrc(lesson),
    };
  }

  const videoHit = urls.find(isPlayableVideoUrl);
  if (videoHit) {
    return {
      kind: 'video',
      src: videoHit,
      captionSrc: resolveCaptionSrc(lesson),
    };
  }

  const leftoverAudio = urls.find(isAudioUrl);
  if (leftoverAudio) {
    return { kind: 'audio', src: leftoverAudio };
  }

  const pdfHit = urls.find(isPdfUrl);
  if (pdfHit) {
    return { kind: 'pdf', src: pdfHit };
  }

  if (htmlToPlain(lesson.bodyHtml)) {
    return { kind: 'article' };
  }

  return { kind: 'empty' };
}
