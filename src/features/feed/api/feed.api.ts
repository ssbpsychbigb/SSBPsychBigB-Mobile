/**
 * Feed + Day Brief API — same contracts as the web app.
 */

import { apiRequest } from '@/shared/api';
import type { FeedTabKey } from '@/features/feed/data/feed-preview';
import type {
  CreatePostInput,
  DayBriefItem,
  FeedComment,
  FeedPage,
  FeedPost,
  SharePayload,
} from '@/features/feed/types/feed.types';

function withCursor(path: string, cursor?: string | null, limit = 20): string {
  const search = new URLSearchParams();
  if (cursor) {
    search.set('cursor', cursor);
  }
  search.set('limit', String(limit));
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

const TAB_PATH: Record<FeedTabKey, string> = {
  forYou: '/feed/for-you',
  latest: '/feed/latest',
  following: '/feed/following',
  trending: '/feed/trending',
};

export const feedApi = {
  getTimeline(
    tab: FeedTabKey,
    token?: string | null,
    cursor?: string | null,
  ): Promise<FeedPage> {
    return apiRequest<FeedPage>(withCursor(TAB_PATH[tab], cursor), { token });
  },

  toggleLike(postId: string, token: string) {
    return apiRequest<{ liked: boolean; likes: number }>(
      `/posts/${postId}/like`,
      { method: 'POST', token, body: { reactionType: 'like' } },
    );
  },

  toggleBookmark(postId: string, token: string) {
    return apiRequest<{ bookmarked: boolean; saves: number }>(
      `/posts/${postId}/bookmark`,
      { method: 'POST', token },
    );
  },

  toggleFollow(userId: string, token: string) {
    return apiRequest<{ following: boolean }>(`/follows/${userId}`, {
      method: 'POST',
      token,
    });
  },

  sharePost(postId: string, token: string) {
    return apiRequest<SharePayload>(`/posts/${postId}/share`, {
      method: 'POST',
      token,
    });
  },

  listComments(postId: string, token?: string | null) {
    return apiRequest<{ items: FeedComment[] }>(`/posts/${postId}/comments`, {
      token,
    });
  },

  addComment(postId: string, content: string, token: string) {
    return apiRequest<FeedComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      token,
      body: { content },
    });
  },

  uploadMedia(formData: FormData, token: string) {
    return apiRequest<{
      media: Array<{ mediaType: string; url: string; thumbnail: string }>;
    }>('/posts/media', { method: 'POST', formData, token });
  },

  createPost(input: CreatePostInput, token: string) {
    return apiRequest<FeedPost>('/posts', {
      method: 'POST',
      token,
      body: input,
    });
  },

  deletePost(postId: string, token: string) {
    return apiRequest<{ id: string; status: string }>(`/posts/${postId}`, {
      method: 'DELETE',
      token,
    });
  },

  reportPost(postId: string, body: { reason: string; note?: string }, token: string) {
    return apiRequest<{ reported: boolean; openReports: number; hidden: boolean }>(
      `/posts/${postId}/report`,
      { method: 'POST', token, body },
    );
  },

  togglePin(postId: string, token: string) {
    return apiRequest<{ pinned: boolean; pinnedAt: string | null }>(
      `/posts/${postId}/pin`,
      { method: 'POST', token },
    );
  },

  listProfilePosts(username: string, token?: string | null) {
    return apiRequest<FeedPage>(
      `/profile/${encodeURIComponent(username)}/posts?limit=20`,
      { token },
    );
  },

  getReels(token?: string | null, cursor?: string | null) {
    return apiRequest<FeedPage>(withCursor('/feed/reels', cursor), { token });
  },
};

export const dayBriefApi = {
  list(token?: string | null) {
    return apiRequest<{ items: DayBriefItem[] }>('/day-briefs', { token });
  },

  uploadMedia(formData: FormData, token: string) {
    return apiRequest<{
      mediaType: 'image' | 'video';
      url: string;
      thumbnail: string;
    }>('/day-briefs/media', { method: 'POST', formData, token });
  },

  create(
    token: string,
    input: {
      caption?: string;
      mediaUrl: string;
      mediaType: 'image' | 'video';
      durationSec?: number;
      thumbnailUrl?: string;
    },
  ) {
    return apiRequest<DayBriefItem>('/day-briefs', {
      method: 'POST',
      token,
      body: input,
    });
  },

  markViewed(token: string, briefId: string) {
    return apiRequest<{ id: string; viewed: boolean }>(
      `/day-briefs/${briefId}/view`,
      { method: 'POST', token },
    );
  },
};
