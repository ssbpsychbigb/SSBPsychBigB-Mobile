/**
 * Public profile REST — same paths as web `profile.api.ts`.
 */

import { apiRequest } from '@/shared/api';
import type { FeedPage } from '@/features/feed/types/feed.types';
import type {
  MemberProfile,
  ProfileAchievement,
  TimelineEvent,
} from '@/features/profile/types/profile.types';

export const profileApi = {
  getByUsername(username: string, token?: string | null) {
    return apiRequest<MemberProfile>(`/profile/${encodeURIComponent(username)}`, {
      token,
    });
  },

  getPosts(username: string, token?: string | null) {
    return apiRequest<FeedPage>(
      `/profile/${encodeURIComponent(username)}/posts?limit=20`,
      { token },
    );
  },

  getTimeline(username: string, token?: string | null) {
    return apiRequest<{ items: TimelineEvent[] }>(
      `/profile/${encodeURIComponent(username)}/timeline`,
      { token },
    );
  },

  getAchievements(username: string, token?: string | null) {
    return apiRequest<{ items: ProfileAchievement[] }>(
      `/profile/${encodeURIComponent(username)}/achievements`,
      { token },
    );
  },
};
