/**
 * Learning paths + daily mission.
 */

import { apiRequest } from '@/shared/api/client';
import type { CourseCard } from '@/features/learn/types/course.types';

export type LearningPathSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  examGoal: string;
  estimatedWeeks: number;
  courseCount: number;
};

export type LearningPathDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  examGoal: string;
  estimatedWeeks: number;
  steps: Array<{
    sequence: number;
    course: CourseCard;
    enrolled: boolean;
    liveHint: string | null;
  }>;
  progress: {
    enrolledCount: number;
    total: number;
    pct: number;
  };
};

export type DailyMissionTask = {
  id: string;
  label: string;
  target: number;
  current: number;
  done: boolean;
  optional?: boolean;
};

export type DailyMission = {
  dayKey: string;
  tasks: DailyMissionTask[];
  complete: boolean;
  claimed: boolean;
  continueCourse: (CourseCard & {
    lastLessonId: string | null;
    progressPct: number;
  }) | null;
  streakHint: string;
};

export const coursePathApi = {
  listPaths(examGoal?: string, token?: string | null) {
    const qs =
      examGoal && examGoal !== 'all'
        ? `?examGoal=${encodeURIComponent(examGoal)}`
        : '';
    return apiRequest<{ items: LearningPathSummary[] }>(
      `/courses/paths${qs}`,
      { token },
    );
  },

  getPath(slug: string, token?: string | null) {
    return apiRequest<LearningPathDetail>(
      `/courses/paths/${encodeURIComponent(slug)}`,
      { token },
    );
  },

  dailyMission(token: string) {
    return apiRequest<DailyMission>('/courses/daily-mission', { token });
  },

  claimMission(token: string) {
    return apiRequest<DailyMission>('/courses/daily-mission/claim', {
      method: 'POST',
      token,
      body: {},
    });
  },
};
