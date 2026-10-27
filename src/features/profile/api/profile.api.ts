/**
 * Public profile REST — same paths as web `profile.api.ts`.
 */

import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { apiRequest } from '@/shared/api';
import type { FeedPage } from '@/features/feed/types/feed.types';
import type {
  MemberProfile,
  ProfileAchievement,
  TimelineEvent,
} from '@/features/profile/types/profile.types';

export type ProfileGridKind = 'posts' | 'reels' | 'collabs';

export const profilePostKeys = {
  all: ['profile-posts'] as const,
  list: (username: string, session: string, kind: ProfileGridKind = 'posts') =>
    [...profilePostKeys.all, username, session, kind] as const,
};

export type ProfileEditInput = {
  fullName?: string;
  username?: string;
  bio?: string;
  city?: string;
  removePhoto?: boolean;
};

export const profileApi = {
  updateMe(input: ProfileEditInput, token: string) {
    return apiRequest<MemberProfile>('/profile/me', {
      method: 'PATCH',
      token,
      body: input,
    });
  },

  uploadPhoto(asset: PickedAsset, token: string) {
    const formData = new FormData();
    formData.append('photo', toMultipartFilePart(asset, 'photo') as unknown as Blob);
    return apiRequest<MemberProfile>('/profile/me/photo', {
      method: 'POST',
      token,
      formData,
    });
  },

  getByUsername(username: string, token?: string | null) {
    return apiRequest<MemberProfile>(`/profile/${encodeURIComponent(username)}`, {
      token,
    });
  },

  getPosts(
    username: string,
    token?: string | null,
    cursor?: string | null,
    kind: ProfileGridKind = 'posts',
  ) {
    const search = new URLSearchParams({ limit: '18', kind });
    if (cursor) {
      search.set('cursor', cursor);
    }
    return apiRequest<FeedPage>(
      `/profile/${encodeURIComponent(username)}/posts?${search.toString()}`,
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
