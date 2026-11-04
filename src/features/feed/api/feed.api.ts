/**
 * Feed + Day Brief API — same contracts as the web app.
 */

import { apiRequest } from '@/shared/api';
import type { FeedTabKey } from '@/features/feed/data/feed-preview';
import type {
  CreatePostInput,
  DayBriefItem,
  DirectoryPerson,
  FeedComment,
  FeedPage,
  FeedPost,
  SharePayload,
  UpdatePostInput,
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
  getMeta() {
    return apiRequest<{ categories: Array<{ value: string; label: string }> }>('/feed/meta');
  },

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
    return apiRequest<{ items: FeedComment[]; canPin?: boolean }>(
      `/posts/${postId}/comments`,
      { token },
    );
  },

  pinComment(postId: string, commentId: string, token: string) {
    return apiRequest<{ pinned: boolean; commentId: string; pinnedAt: string | null }>(
      `/posts/${postId}/comments/${commentId}/pin`,
      { method: 'POST', token },
    );
  },

  searchDirectory(kind: 'people' | 'institutes', q: string, token?: string | null) {
    const search = new URLSearchParams({ kind, q, limit: '20' });
    return apiRequest<{ items: DirectoryPerson[] }>(
      `/feed/directory?${search.toString()}`,
      { token },
    );
  },

  addComment(
    postId: string,
    content: string,
    token: string,
    parentCommentId?: string | null,
  ) {
    return apiRequest<FeedComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      token,
      body: {
        content,
        parentCommentId: parentCommentId || undefined,
      },
    });
  },

  toggleCommentLike(postId: string, commentId: string, token: string) {
    return apiRequest<{ commentId: string; liked: boolean; likesCount: number }>(
      `/posts/${postId}/comments/${commentId}/like`,
      { method: 'POST', token },
    );
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

  listDrafts(token: string) {
    return apiRequest<FeedPage>(withCursor('/posts/drafts', null, 30), { token });
  },

  updatePost(postId: string, input: UpdatePostInput, token: string) {
    return apiRequest<FeedPost>(`/posts/${postId}`, {
      method: 'PATCH',
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

  getPost(postId: string, token?: string | null) {
    return apiRequest<FeedPost>(`/posts/${encodeURIComponent(postId)}`, { token });
  },

  listBookmarks(token: string, cursor?: string | null) {
    return apiRequest<FeedPage>(withCursor('/bookmarks', cursor), { token });
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
      mediaUrl?: string;
      mediaType: 'image' | 'video' | 'text';
      durationSec?: number;
      thumbnailUrl?: string;
      visibility?: 'public' | 'followers' | 'close_friends';
      audienceUserIds?: string[];
      excludeUserIds?: string[];
      backgroundColor?: string;
      overlayText?: string;
      musicId?: string;
      musicLabel?: string;
      stickers?: Array<{
        id?: string;
        type: string;
        label?: string;
        value?: string;
        x?: number;
        y?: number;
        options?: string[];
      }>;
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

  listViewers(token: string, briefId: string) {
    return apiRequest<{
      items: import('@/features/feed/types/feed.types').DayBriefViewerPerson[];
      total: number;
    }>(`/day-briefs/${briefId}/viewers`, { token });
  },

  react(token: string, briefId: string, emoji: string) {
    return apiRequest<{ id: string; emoji: string }>(
      `/day-briefs/${briefId}/react`,
      { method: 'POST', token, body: { emoji } },
    );
  },

  removeReaction(token: string, briefId: string) {
    return apiRequest<{ id: string; removed: boolean }>(
      `/day-briefs/${briefId}/react`,
      { method: 'DELETE', token },
    );
  },

  votePoll(
    token: string,
    briefId: string,
    input: { stickerId: string; optionIndex: number },
  ) {
    return apiRequest<{
      id: string;
      sticker: import('@/features/feed/types/feed.types').DayBriefSticker;
    }>(`/day-briefs/${briefId}/poll-vote`, {
      method: 'POST',
      token,
      body: input,
    });
  },

  listHighlights(userId: string, token?: string | null) {
    return apiRequest<{
      items: import('@/features/feed/types/feed.types').DayBriefHighlight[];
    }>(`/day-briefs/highlights/${userId}`, { token });
  },

  createHighlight(
    token: string,
    input: { title: string; coverUrl?: string; briefId?: string },
  ) {
    return apiRequest<
      import('@/features/feed/types/feed.types').DayBriefHighlight
    >('/day-briefs/highlights', {
      method: 'POST',
      token,
      body: input,
    });
  },

  addHighlightItem(token: string, highlightId: string, briefId: string) {
    return apiRequest<
      import('@/features/feed/types/feed.types').DayBriefHighlight
    >(`/day-briefs/highlights/${highlightId}/items`, {
      method: 'POST',
      token,
      body: { briefId },
    });
  },

  removeHighlight(token: string, highlightId: string) {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/day-briefs/highlights/${highlightId}`,
      { method: 'DELETE', token },
    );
  },

  remove(token: string, briefId: string) {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/day-briefs/${briefId}`,
      { method: 'DELETE', token },
    );
  },
};
