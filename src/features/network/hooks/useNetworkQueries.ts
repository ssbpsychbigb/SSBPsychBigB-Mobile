/**
 * React Query for Network suggestions and overview.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { networkApi } from '@/features/network/api/network.api';
import type { NetworkGraphKind } from '@/features/network/types/network.types';

export const networkKeys = {
  all: ['network'] as const,
  suggestions: (session: string) =>
    [...networkKeys.all, 'suggestions', session] as const,
  overview: (session: string) => [...networkKeys.all, 'overview', session] as const,
  graph: (username: string, kind: string, session: string) =>
    [...networkKeys.all, 'graph', username, kind, session] as const,
};

export function useNetworkSuggestionsQuery(token: string | null) {
  const session = token || 'guest';
  return useInfiniteQuery({
    queryKey: networkKeys.suggestions(session),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => networkApi.getSuggestions(token, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });
}

export function useNetworkOverviewQuery(token: string | null) {
  return useQuery({
    queryKey: networkKeys.overview(token || 'guest'),
    enabled: Boolean(token),
    queryFn: () => networkApi.getOverview(token as string),
    staleTime: 30_000,
  });
}

export function useProfileNetworkQuery(
  username: string,
  kind: NetworkGraphKind,
  token: string | null,
) {
  const session = token || 'guest';
  return useInfiniteQuery({
    queryKey: networkKeys.graph(username, kind, session),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      networkApi.getProfileNetwork({
        username,
        kind,
        token,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });
}
