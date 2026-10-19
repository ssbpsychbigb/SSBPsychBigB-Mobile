/**
 * Communities API — same contracts as the web club module.
 */

import { apiRequest } from '@/shared/api';
import type { Conversation } from '@/features/message/types/chat.types';
import type { FeedPage } from '@/features/feed/types/feed.types';
import type {
  Community,
  CommunityBrandUpload,
  CommunityEvent,
  CommunityEventsPage,
  CommunityInvite,
  CommunityMember,
  CommunityMembersPage,
  CommunityPage,
  CommunityResource,
  CommunityResourcesPage,
  CommunityResourceUpload,
  CreateCommunityEventInput,
  CreateCommunityInput,
  CreateCommunityResourceInput,
  DiscoverFilter,
  InstituteCommunityQuota,
} from '@/features/community/types/community.types';

function withQs(path: string, params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export const communityApi = {
  list(params: {
    q?: string;
    cursor?: string | null;
    limit?: number;
    token?: string | null;
    filter?: DiscoverFilter;
  }) {
    return apiRequest<CommunityPage>(
      withQs('/communities', {
        q: params.q,
        cursor: params.cursor,
        limit: params.limit ?? 20,
        filter: params.filter && params.filter !== 'public' ? params.filter : undefined,
      }),
      { token: params.token },
    );
  },

  listMine(token: string, limit = 40) {
    return apiRequest<{ items: Community[] }>(
      withQs('/communities/mine', { limit }),
      { token },
    );
  },

  getInstituteQuota(token: string) {
    return apiRequest<InstituteCommunityQuota>('/communities/quota', { token });
  },

  create(input: CreateCommunityInput, token: string) {
    return apiRequest<Community>('/communities', {
      method: 'POST',
      body: input,
      token,
    });
  },

  getBySlug(slug: string, token?: string | null, invite?: string | null) {
    return apiRequest<Community>(
      withQs(`/communities/${encodeURIComponent(slug)}`, { invite }),
      { token },
    );
  },

  openChat(slug: string, token: string) {
    return apiRequest<Conversation>(
      `/communities/${encodeURIComponent(slug)}/chat`,
      { token },
    );
  },

  join(slug: string, token: string, inviteToken?: string | null) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/join`,
      {
        method: 'POST',
        token,
        body: inviteToken ? { inviteToken } : {},
      },
    );
  },

  leave(slug: string, token: string) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/leave`,
      { method: 'DELETE', token },
    );
  },

  updateSettings(
    slug: string,
    input: {
      visibility?: 'public' | 'private';
      rulesText?: string;
      coverPhotoPath?: string;
      avatarPath?: string;
      name?: string;
      description?: string;
    },
    token: string,
  ) {
    return apiRequest<Community>(`/communities/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      token,
      body: input,
    });
  },

  uploadBrand(formData: FormData, kind: 'cover' | 'avatar', token: string) {
    return apiRequest<CommunityBrandUpload>(
      `/communities/uploads?kind=${encodeURIComponent(kind)}`,
      { method: 'POST', formData, token },
    );
  },

  requestDestructive(
    slug: string,
    type: 'archive' | 'delete' | 'unarchive',
    token: string,
  ) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/${type}/request`,
      { method: 'POST', token },
    );
  },

  decideDestructive(
    slug: string,
    type: 'archive' | 'delete' | 'unarchive',
    decision: 'approve' | 'reject',
    token: string,
  ) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/${type}/decide`,
      { method: 'POST', token, body: { decision } },
    );
  },

  listJoinRequests(
    slug: string,
    params: { cursor?: string | null; limit?: number; token: string },
  ) {
    return apiRequest<CommunityMembersPage>(
      withQs(`/communities/${encodeURIComponent(slug)}/requests`, {
        cursor: params.cursor,
        limit: params.limit ?? 40,
      }),
      { token: params.token },
    );
  },

  decideJoin(
    slug: string,
    userId: string,
    decision: 'approve' | 'reject',
    token: string,
  ) {
    return apiRequest<{ userId: string; status: string }>(
      `/communities/${encodeURIComponent(slug)}/requests/${encodeURIComponent(userId)}/${decision}`,
      { method: 'POST', token },
    );
  },

  listMembers(
    slug: string,
    params: { cursor?: string | null; limit?: number; token?: string | null },
  ) {
    return apiRequest<CommunityMembersPage>(
      withQs(`/communities/${encodeURIComponent(slug)}/members`, {
        cursor: params.cursor,
        limit: params.limit ?? 40,
      }),
      { token: params.token },
    );
  },

  invite(slug: string, token: string, rotate = false) {
    return apiRequest<CommunityInvite>(
      `/communities/${encodeURIComponent(slug)}/invite`,
      { method: 'POST', token, body: { rotate } },
    );
  },

  acceptRules(slug: string, token: string) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/accept-rules`,
      { method: 'POST', token },
    );
  },

  kickMember(slug: string, userId: string, token: string) {
    return apiRequest<{ userId: string; removed: boolean }>(
      `/communities/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE', token },
    );
  },

  muteMember(slug: string, userId: string, mutedUntil: string | null, token: string) {
    return apiRequest<CommunityMember>(
      `/communities/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}/mute`,
      { method: 'PATCH', token, body: { mutedUntil } },
    );
  },

  setCoAdmin(
    slug: string,
    input: { userId: string; rights: Record<string, boolean> },
    token: string,
  ) {
    return apiRequest<CommunityMember>(
      `/communities/${encodeURIComponent(slug)}/co-admin`,
      { method: 'PUT', token, body: input },
    );
  },

  removeCoAdmin(slug: string, token: string) {
    return apiRequest<Community>(
      `/communities/${encodeURIComponent(slug)}/co-admin`,
      { method: 'DELETE', token },
    );
  },

  getFeed(
    slug: string,
    params: {
      cursor?: string | null;
      limit?: number;
      token?: string | null;
      type?: string | null;
    },
  ) {
    return apiRequest<FeedPage>(
      withQs(`/communities/${encodeURIComponent(slug)}/feed`, {
        cursor: params.cursor,
        limit: params.limit ?? 15,
        type: params.type,
      }),
      { token: params.token },
    );
  },

  announce(slug: string, content: string, token: string) {
    return apiRequest(`/communities/${encodeURIComponent(slug)}/announcements`, {
      method: 'POST',
      body: { content },
      token,
    });
  },

  removePost(slug: string, postId: string, token: string) {
    return apiRequest<{ id: string; status: string }>(
      `/communities/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}`,
      { method: 'DELETE', token },
    );
  },

  pinPost(slug: string, postId: string, pinned: boolean, token: string) {
    const path = `/communities/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}/pin`;
    return apiRequest<{ id: string; communityPinnedAt: string | null }>(
      path,
      pinned
        ? { method: 'POST', token, body: { pinned: true } }
        : { method: 'DELETE', token },
    );
  },

  listResources(
    slug: string,
    params: {
      q?: string;
      cursor?: string | null;
      limit?: number;
      token?: string | null;
    },
  ) {
    return apiRequest<CommunityResourcesPage>(
      withQs(`/communities/${encodeURIComponent(slug)}/resources`, {
        q: params.q,
        cursor: params.cursor,
        limit: params.limit ?? 30,
      }),
      { token: params.token },
    );
  },

  uploadResourceFile(slug: string, formData: FormData, token: string) {
    return apiRequest<CommunityResourceUpload>(
      `/communities/${encodeURIComponent(slug)}/resources/upload`,
      { method: 'POST', formData, token },
    );
  },

  createResource(slug: string, body: CreateCommunityResourceInput, token: string) {
    return apiRequest<CommunityResource>(
      `/communities/${encodeURIComponent(slug)}/resources`,
      { method: 'POST', body, token },
    );
  },

  deleteResource(slug: string, resourceId: string, token: string) {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/communities/${encodeURIComponent(slug)}/resources/${encodeURIComponent(resourceId)}`,
      { method: 'DELETE', token },
    );
  },

  listEvents(
    slug: string,
    params: {
      scope?: 'upcoming' | 'past' | 'all';
      cursor?: string | null;
      limit?: number;
      token?: string | null;
    },
  ) {
    return apiRequest<CommunityEventsPage>(
      withQs(`/communities/${encodeURIComponent(slug)}/events`, {
        scope: params.scope,
        cursor: params.cursor,
        limit: params.limit ?? 20,
      }),
      { token: params.token },
    );
  },

  createEvent(slug: string, body: CreateCommunityEventInput, token: string) {
    return apiRequest<CommunityEvent>(
      `/communities/${encodeURIComponent(slug)}/events`,
      { method: 'POST', body, token },
    );
  },

  cancelEvent(slug: string, eventId: string, token: string) {
    return apiRequest<CommunityEvent>(
      `/communities/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE', token },
    );
  },

  setEventRsvp(
    slug: string,
    eventId: string,
    status: 'going' | 'interested',
    token: string,
  ) {
    return apiRequest<CommunityEvent>(
      `/communities/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}/rsvp`,
      { method: 'POST', token, body: { status } },
    );
  },

  clearEventRsvp(slug: string, eventId: string, token: string) {
    return apiRequest<CommunityEvent>(
      `/communities/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}/rsvp`,
      { method: 'DELETE', token },
    );
  },
};
