/**
 * Single post + saved library queries. Shared by PostDetail, Saved, and Notifications links.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { feedApi } from '@/features/feed/api/feed.api';

export const postKeys = {
  all: ['post'] as const,
  detail: (postId: string, session: string) =>
    [...postKeys.all, 'detail', postId, session] as const,
};

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  list: (session: string) => [...bookmarkKeys.all, 'list', session] as const,
};

export function usePostQuery(postId: string | undefined, token: string | null) {
  return useQuery({
    queryKey: postKeys.detail(postId || '', token || 'guest'),
    enabled: Boolean(postId),
    queryFn: () => feedApi.getPost(postId as string, token),
    staleTime: 15_000,
  });
}

/**
 * Saved posts and reels (`GET /bookmarks`). Members only.
 */
export function useBookmarksQuery(token: string | null) {
  return useInfiniteQuery({
    queryKey: bookmarkKeys.list(token || 'guest'),
    enabled: Boolean(token),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => feedApi.listBookmarks(token as string, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 10_000,
  });
}
