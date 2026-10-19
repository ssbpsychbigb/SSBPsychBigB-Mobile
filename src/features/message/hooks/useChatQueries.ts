/**
 * React Query for chat inbox and threads.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { chatApi } from '@/features/message/api/chat.api';
import type { MessagingFilter } from '@/features/message/types/chat.types';

export const chatKeys = {
  all: ['chat'] as const,
  inbox: (token: string, filter: string, q: string) =>
    [...chatKeys.all, 'inbox', token, filter, q] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (id: string) => [...chatKeys.all, 'messages', id] as const,
  unread: (token: string) => [...chatKeys.all, 'unread', token] as const,
  people: (token: string, q: string) =>
    [...chatKeys.all, 'people', token, q] as const,
};

export function useChatInboxQuery(
  token: string | null,
  filter: MessagingFilter,
  q: string,
) {
  return useQuery({
    queryKey: chatKeys.inbox(token || 'guest', filter, q),
    enabled: Boolean(token),
    queryFn: () =>
      chatApi.listConversations({
        token: token as string,
        filter,
        q: q.trim() || undefined,
        limit: 50,
      }),
    staleTime: 15_000,
  });
}

export function useChatConversationQuery(
  conversationId: string | undefined,
  token: string | null,
) {
  return useQuery({
    queryKey: chatKeys.conversation(conversationId || ''),
    enabled: Boolean(token && conversationId),
    queryFn: () =>
      chatApi.getConversation(conversationId as string, token as string),
  });
}

export function useChatMessagesQuery(
  conversationId: string | undefined,
  token: string | null,
) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId || ''),
    enabled: Boolean(token && conversationId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      chatApi.listMessages({
        conversationId: conversationId as string,
        token: token as string,
        before: pageParam,
        limit: 40,
      }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 10_000,
  });
}

export function useChatUnreadQuery(token: string | null) {
  return useQuery({
    queryKey: chatKeys.unread(token || 'guest'),
    enabled: Boolean(token),
    queryFn: () => chatApi.unreadCount(token as string),
    staleTime: 15_000,
  });
}

export function useChatPeopleQuery(token: string | null, q: string, enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.people(token || 'guest', q.trim()),
    enabled: Boolean(token) && enabled,
    queryFn: () =>
      chatApi.listPeople({
        token: token as string,
        q: q.trim() || undefined,
        limit: 60,
      }),
    staleTime: 20_000,
  });
}
