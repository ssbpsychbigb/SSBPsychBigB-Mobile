/**
 * Stable copy for start failures. The toast still shows the server message.
 */

import { ApiError } from '@/shared/api/types';

export type StartGate = {
  code: string;
  line: string;
  courseSlug?: string;
};

function detailsOf(error: ApiError): Record<string, unknown> {
  if (!error.details || typeof error.details !== 'object') return {};
  return error.details as Record<string, unknown>;
}

/**
 * Maps a start error onto a line the detail screen can keep visible.
 */
export function startGateFromError(error: unknown): StartGate | null {
  if (!(error instanceof ApiError) || !error.code) return null;
  const details = detailsOf(error);
  const courseSlug =
    typeof details.courseSlug === 'string' ? details.courseSlug : undefined;
  const need = Number(details.requireCoursePct);
  const progress = Number(details.progressPct);

  if (error.code === 'ASSESSMENT_ENROLL_REQUIRED') {
    return {
      code: error.code,
      line: 'Enroll in the linked course before this test.',
      courseSlug,
    };
  }
  if (error.code === 'ASSESSMENT_COURSE_PROGRESS') {
    return {
      code: error.code,
      line:
        Number.isFinite(need) && need > 0
          ? `Reach ${need}% of the linked course first${
              Number.isFinite(progress) ? ` (you are at ${progress}%)` : ''
            }.`
          : 'Finish more of the linked course first.',
      courseSlug,
    };
  }
  if (error.code === 'ASSESSMENT_PREREQ') {
    return { code: error.code, line: 'Pass the required tests first.' };
  }
  if (error.code === 'ASSESSMENT_WINDOW') {
    return {
      code: error.code,
      line: 'This test is outside its start and end window.',
    };
  }
  if (error.code === 'ASSESSMENT_NOT_OPEN') {
    return { code: error.code, line: 'This test is not open.' };
  }
  if (error.code === 'ASSESSMENT_INSTITUTE_ONLY') {
    return { code: error.code, line: 'This test is for institute members.' };
  }
  if (error.code === 'ASSESSMENT_COURSE_REQUIRED') {
    return { code: error.code, line: 'This test is missing its course link.' };
  }
  if (error.code === 'ASSESSMENT_PAYMENT_REQUIRED') {
    return {
      code: error.code,
      line: 'Buy this test to unlock Start.',
    };
  }
  return null;
}

export function revealRuleLabel(revealAnswers: string | undefined) {
  if (revealAnswers === 'never') return 'Answer keys stay hidden';
  if (revealAnswers === 'after_window') return 'Review opens after the test window';
  return 'Review opens after you submit';
}
