import {
  isAudioUrl,
  isPdfUrl,
  resolveLessonExperience,
} from '@/features/learn/lib/lesson-experience';
import type { LessonDetails } from '@/features/learn/types/course.types';

function lesson(partial: Partial<LessonDetails>): LessonDetails {
  return {
    id: 'l1',
    title: 'Lesson',
    lessonType: 'video',
    durationSec: 60,
    sequence: 1,
    videoUrl: '',
    videoPath: '',
    previewAvailable: false,
    course: { id: 'c1', title: 'Course', slug: 'course', completionPct: 0 },
    enrollment: null,
    progress: null,
    prevLesson: null,
    nextLesson: null,
    ...partial,
  };
}

describe('lesson media sniffing', () => {
  it('detects audio files from any host', () => {
    expect(isAudioUrl('https://cdn.example.com/lecture.mp3')).toBe(true);
    expect(isAudioUrl('https://s3.amazonaws.com/bucket/a.m4a?X-Amz=1')).toBe(
      true,
    );
  });

  it('detects pdf files', () => {
    expect(isPdfUrl('/uploads/courses/notes.pdf')).toBe(true);
    expect(isPdfUrl('https://files.aws/x.pdf')).toBe(true);
  });
});

describe('resolveLessonExperience', () => {
  it('plays YouTube inside the player, not as a file', () => {
    const exp = resolveLessonExperience(
      lesson({ videoUrl: 'https://youtu.be/dQw4w9wgGcQ' }),
    );
    expect(exp).toEqual({ kind: 'youtube', videoId: 'dQw4w9wgGcQ' });
  });

  it('plays signed stream / S3 mp4 as video', () => {
    const exp = resolveLessonExperience(
      lesson({
        streamUrl: 'https://s3.amazonaws.com/bucket/lec.mp4?X-Amz-Signature=1',
      }),
    );
    expect(exp.kind).toBe('video');
    if (exp.kind === 'video') {
      expect(exp.src).toContain('lec.mp4');
    }
  });

  it('plays mp3 / m4a as audio even when lessonType is video', () => {
    const exp = resolveLessonExperience(
      lesson({
        lessonType: 'video',
        videoUrl: 'https://cdn.example.com/section-1-5.m4a',
      }),
    );
    expect(exp).toEqual({
      kind: 'audio',
      src: 'https://cdn.example.com/section-1-5.m4a',
    });
  });

  it('opens PDF lectures in-player', () => {
    const exp = resolveLessonExperience(
      lesson({
        lessonType: 'pdf',
        resourcePaths: ['/uploads/courses/olq-notes.pdf'],
      }),
    );
    expect(exp.kind).toBe('pdf');
  });

  it('does not steal a video lesson into audio because a resource mp3 exists', () => {
    const exp = resolveLessonExperience(
      lesson({
        lessonType: 'video',
        streamUrl: 'https://api.example.com/api/v1/courses/x/lessons/y/stream',
        resourcePaths: ['https://cdn.example.com/bonus.mp3'],
      }),
    );
    expect(exp.kind).toBe('video');
  });

  it('does not steal a video lesson into PDF because notes exist', () => {
    const exp = resolveLessonExperience(
      lesson({
        lessonType: 'video',
        streamUrl: 'https://api.example.com/api/v1/courses/x/lessons/y/stream',
        resourcePaths: ['/uploads/courses/handout.pdf'],
      }),
    );
    expect(exp.kind).toBe('video');
  });

  it('keeps quiz and live as their own stages', () => {
    expect(resolveLessonExperience(lesson({ lessonType: 'quiz' })).kind).toBe(
      'quiz',
    );
    expect(
      resolveLessonExperience(
        lesson({ lessonType: 'live_link', videoUrl: 'https://meet.google.com/x' }),
      ),
    ).toEqual({ kind: 'live', url: 'https://meet.google.com/x' });
  });
});
