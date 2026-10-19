/**
 * React Query keys and timeline fetch for the Home feed.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { dayBriefApi, feedApi } from '@/features/feed/api/feed.api';
import type { FeedTabKey } from '@/features/feed/data/feed-preview';

export const feedKeys = {
  all: ['feed'] as const,
  timeline: (tab: FeedTabKey, session: string) =>
    [...feedKeys.all, 'timeline', tab, session] as const,
};

export const dayBriefKeys = {
  all: ['day-briefs'] as const,
  list: (session: string) => [...dayBriefKeys.all, 'list', session] as const,
};

/**
 * Paginated feed for one tab. Guests may load public tabs without a token.
 */
export function useFeedTimelineQuery(
  tab: FeedTabKey,
  token: string | null,
  enabled: boolean,
) {
  const session = token || 'guest';

  return useInfiniteQuery({
    queryKey: feedKeys.timeline(tab, session),
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => feedApi.getTimeline(tab, token, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 20_000,
  });
}

/**
 * Day Briefs — guests can read the public tray; writes still need a token.
 */
export function useDayBriefsQuery(token: string | null) {
  return useQuery({
    queryKey: dayBriefKeys.list(token || 'guest'),
    queryFn: () => dayBriefApi.list(token),
    staleTime: 30_000,
  });
}
