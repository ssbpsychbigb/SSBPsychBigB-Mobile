/**
 * Notification list, unread badge, and read-state mutations.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { notificationsApi } from '@/features/notifications/api/notifications.api';
import type { NotificationPage } from '@/features/notifications/types/notification.types';
import { showErrorToast } from '@/shared/ui/toast';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (session: string) => [...notificationKeys.all, 'list', session] as const,
  unread: (session: string) => [...notificationKeys.all, 'unread', session] as const,
};

export function useNotificationsQuery(token: string | null) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(token || 'guest'),
    enabled: Boolean(token),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => notificationsApi.list(token as string, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 15_000,
  });
}

/**
 * Bell badge. No socket for notifications yet, so poll gently while signed in.
 */
export function useNotificationUnreadQuery(token: string | null) {
  return useQuery({
    queryKey: notificationKeys.unread(token || 'guest'),
    enabled: Boolean(token),
    queryFn: () => notificationsApi.unreadCount(token as string),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

type ListData = InfiniteData<NotificationPage>;

function setUnread(
  current: ListData | undefined,
  matches: (id: string) => boolean,
): ListData | undefined {
  if (!current) {
    return current;
  }
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) =>
        matches(item.id) ? { ...item, unread: false } : item,
      ),
    })),
  };
}

export function useMarkNotificationRead(token: string | null) {
  const queryClient = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id, token as string),
    onMutate: (id) => {
      queryClient.setQueryData<ListData>(notificationKeys.list(session), (current) =>
        setUnread(current, (itemId) => itemId === id),
      );
      queryClient.setQueryData<{ unreadCount: number }>(
        notificationKeys.unread(session),
        (current) =>
          current ? { unreadCount: Math.max(0, current.unreadCount - 1) } : current,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRemoveNotification(token: string | null) {
  const queryClient = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id, token as string),
    onMutate: (id) => {
      queryClient.setQueryData<ListData>(notificationKeys.list(session), (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== id),
              })),
            }
          : current,
      );
    },
    onError: (error) => {
      showErrorToast(error, 'Could not remove this notification.', 'Alerts');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead(token: string | null) {
  const queryClient = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(token as string),
    onMutate: () => {
      queryClient.setQueryData<ListData>(notificationKeys.list(session), (current) =>
        setUnread(current, () => true),
      );
      queryClient.setQueryData(notificationKeys.unread(session), { unreadCount: 0 });
    },
    onError: (error) => {
      showErrorToast(error, 'Could not mark notifications as read.', 'Alerts');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
