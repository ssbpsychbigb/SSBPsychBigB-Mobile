/**
 * Notifications API — `/notifications/*`, active members only.
 */

import { apiRequest } from '@/shared/api';
import type { NotificationPage } from '@/features/notifications/types/notification.types';

export const notificationsApi = {
  list(token: string, cursor?: string | null) {
    const search = new URLSearchParams({ limit: '20' });
    if (cursor) {
      search.set('cursor', cursor);
    }
    return apiRequest<NotificationPage>(`/notifications?${search.toString()}`, { token });
  },

  unreadCount(token: string) {
    return apiRequest<{ unreadCount: number }>('/notifications/unread-count', { token });
  },

  markRead(id: string, token: string) {
    return apiRequest<{ id: string; unread: boolean }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: 'POST', token },
    );
  },

  remove(id: string, token: string) {
    return apiRequest<{ id: string; deleted: boolean }>(
      `/notifications/${encodeURIComponent(id)}`,
      { method: 'DELETE', token },
    );
  },

  markAllRead(token: string) {
    return apiRequest<{ updated: number }>('/notifications/read-all', {
      method: 'POST',
      token,
    });
  },
};
