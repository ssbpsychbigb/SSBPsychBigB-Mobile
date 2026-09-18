/**
 * React Query for `/feed/reels`.
 */

import { useInfiniteQuery } from '@tanstack/react-query';

import { feedApi } from '@/features/feed/api/feed.api';

export const reelKeys = {
  all: ['reels'] as const,
  list: (session: string) => [...reelKeys.all, 'list', session] as const,
};

/**
 * Public video posts. Guests can load without a token.
 */
export function useReelsQuery(token: string | null) {
  const session = token || 'guest';
  return useInfiniteQuery({
    queryKey: reelKeys.list(session),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => feedApi.getReels(token, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 20_000,
  });
}
