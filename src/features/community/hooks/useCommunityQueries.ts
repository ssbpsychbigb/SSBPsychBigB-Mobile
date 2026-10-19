/**
 * React Query keys and community fetches.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { communityApi } from '@/features/community/api/community.api';
import type {
  CreateCommunityEventInput,
  CreateCommunityInput,
  CreateCommunityResourceInput,
  DiscoverFilter,
} from '@/features/community/types/community.types';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const communityKeys = {
  all: ['communities'] as const,
  discover: (filter: DiscoverFilter, q: string, session: string) =>
    [...communityKeys.all, 'discover', filter, q, session] as const,
  mine: (session: string) => [...communityKeys.all, 'mine', session] as const,
  quota: (session: string) => [...communityKeys.all, 'quota', session] as const,
  detail: (slug: string) => [...communityKeys.all, 'detail', slug] as const,
  feed: (slug: string, type: string) =>
    [...communityKeys.all, 'feed', slug, type] as const,
  members: (slug: string) => [...communityKeys.all, 'members', slug] as const,
  requests: (slug: string) => [...communityKeys.all, 'requests', slug] as const,
  resources: (slug: string, q: string) =>
    [...communityKeys.all, 'resources', slug, q] as const,
  events: (slug: string, scope: string) =>
    [...communityKeys.all, 'events', slug, scope] as const,
};

export function useCommunitiesQuery(filter: DiscoverFilter, q = '') {
  const token = useAuthStore((s) => s.accessToken);
  const session = token || 'guest';
  return useInfiniteQuery({
    queryKey: communityKeys.discover(filter, q, session),
    enabled: true,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.list({
        filter,
        q,
        cursor: pageParam,
        token,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    staleTime: 20_000,
  });
}

export function useMyCommunitiesQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: communityKeys.mine(token || 'guest'),
    enabled: enabled && Boolean(token),
    queryFn: () => communityApi.listMine(token as string),
    staleTime: 15_000,
  });
}

export function useInstituteCommunityQuotaQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: communityKeys.quota(token || 'guest'),
    enabled: enabled && Boolean(token),
    queryFn: () => communityApi.getInstituteQuota(token as string),
    staleTime: 30_000,
  });
}

export function useCommunityQuery(slug: string, invite?: string | null) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [...communityKeys.detail(slug), invite || '', token || 'guest'],
    enabled: Boolean(slug),
    queryFn: () => communityApi.getBySlug(slug, token, invite),
    staleTime: 10_000,
  });
}

export function useCommunityFeedQuery(
  slug: string,
  enabled = true,
  type: 'all' | 'question' = 'all',
) {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: communityKeys.feed(slug, type),
    enabled: Boolean(slug) && enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.getFeed(slug, {
        cursor: pageParam,
        token,
        type: type === 'all' ? null : type,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useCommunityMembersQuery(slug: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: communityKeys.members(slug),
    enabled: Boolean(slug) && enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.listMembers(slug, { cursor: pageParam, token }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useCommunityRequestsQuery(slug: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: communityKeys.requests(slug),
    enabled: enabled && Boolean(token) && Boolean(slug),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.listJoinRequests(slug, {
        cursor: pageParam,
        token: token as string,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useCommunityResourcesQuery(slug: string, enabled = true, q = '') {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: communityKeys.resources(slug, q),
    enabled: Boolean(slug) && enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.listResources(slug, { q, cursor: pageParam, token }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

export function useCommunityEventsQuery(
  slug: string,
  enabled = true,
  scope: 'upcoming' | 'past' = 'upcoming',
) {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: communityKeys.events(slug, scope),
    enabled: Boolean(slug) && enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      communityApi.listEvents(slug, { scope, cursor: pageParam, token }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
  });
}

function useInvalidateClub(slug?: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: communityKeys.all });
    if (slug) {
      void queryClient.invalidateQueries({ queryKey: communityKeys.detail(slug) });
    }
  };
}

export function useCreateCommunityMutation() {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub();
  return useMutation({
    mutationFn: (input: CreateCommunityInput) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.create(input, token);
    },
    onSuccess: invalidate,
  });
}

export function useJoinCommunityMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (invite?: string | null) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.join(slug, token, invite);
    },
    onSuccess: invalidate,
  });
}

export function useLeaveCommunityMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.leave(slug, token);
    },
    onSuccess: invalidate,
  });
}

export function useDecideJoinMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: { userId: string; decision: 'approve' | 'reject' }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.decideJoin(slug, input.userId, input.decision, token);
    },
    onSuccess: invalidate,
  });
}

export function useAcceptCommunityRulesMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.acceptRules(slug, token);
    },
    onSuccess: invalidate,
  });
}

export function useCommunityInviteMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useMutation({
    mutationFn: (rotate: boolean) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.invite(slug, token, rotate);
    },
  });
}

export function useUpdateCommunityMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: Parameters<typeof communityApi.updateSettings>[1]) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.updateSettings(slug, input, token);
    },
    onSuccess: invalidate,
  });
}

export function useDestructiveCommunityMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: {
      type: 'archive' | 'delete' | 'unarchive';
      mode: 'request' | 'approve' | 'reject';
    }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      if (input.mode === 'request') {
        return communityApi.requestDestructive(slug, input.type, token);
      }
      return communityApi.decideDestructive(
        slug,
        input.type,
        input.mode === 'approve' ? 'approve' : 'reject',
        token,
      );
    },
    onSuccess: invalidate,
  });
}

export function useAnnounceMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (content: string) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.announce(slug, content, token);
    },
    onSuccess: invalidate,
  });
}

export function useCreateResourceMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (body: CreateCommunityResourceInput) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.createResource(slug, body, token);
    },
    onSuccess: invalidate,
  });
}

export function useCreateEventMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (body: CreateCommunityEventInput) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.createEvent(slug, body, token);
    },
    onSuccess: invalidate,
  });
}

export function useKickMemberMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (userId: string) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.kickMember(slug, userId, token);
    },
    onSuccess: invalidate,
  });
}

export function useSetCoAdminMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: { userId: string; rights: Record<string, boolean> }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.setCoAdmin(slug, input, token);
    },
    onSuccess: invalidate,
  });
}

export function useRemoveCoAdminMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.removeCoAdmin(slug, token);
    },
    onSuccess: invalidate,
  });
}

export function useMuteMemberMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: { userId: string; mutedUntil: string | null }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.muteMember(slug, input.userId, input.mutedUntil, token);
    },
    onSuccess: invalidate,
  });
}

export function useClubPostModerateMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: async (input: {
      postId: string;
      action: 'pin' | 'unpin' | 'remove';
    }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      if (input.action === 'remove') {
        return communityApi.removePost(slug, input.postId, token);
      }
      return communityApi.pinPost(slug, input.postId, input.action === 'pin', token);
    },
    onSuccess: invalidate,
  });
}

export function useEventRsvpMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (input: {
      eventId: string;
      status: 'going' | 'interested' | null;
    }) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      if (!input.status) {
        return communityApi.clearEventRsvp(slug, input.eventId, token);
      }
      return communityApi.setEventRsvp(slug, input.eventId, input.status, token);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteResourceMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (resourceId: string) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.deleteResource(slug, resourceId, token);
    },
    onSuccess: invalidate,
  });
}

export function useCancelEventMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const invalidate = useInvalidateClub(slug);
  return useMutation({
    mutationFn: (eventId: string) => {
      if (!token) {
        throw new Error('Authentication required');
      }
      return communityApi.cancelEvent(slug, eventId, token);
    },
    onSuccess: invalidate,
  });
}
