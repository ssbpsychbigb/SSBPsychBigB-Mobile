/**
 * Filter chips + time sections for the notifications inbox.
 */

import type {
  AppNotification,
  NotificationKind,
} from '@/features/notifications/types/notification.types';

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'comments'
  | 'likes'
  | 'follows'
  | 'community'
  | 'updates';

export const NOTIFICATION_FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'comments', label: 'Comments' },
  { key: 'likes', label: 'Likes' },
  { key: 'follows', label: 'Follows' },
  { key: 'community', label: 'Community' },
  { key: 'updates', label: 'Updates' },
];

const FILTER_KINDS: Partial<Record<NotificationFilter, NotificationKind[]>> = {
  comments: ['comment', 'reply', 'mention'],
  likes: ['like', 'share'],
  follows: ['follow'],
  updates: ['reminder', 'course', 'assessment', 'moderation'],
};

export function matchesFilter(item: AppNotification, filter: NotificationFilter): boolean {
  if (filter === 'all') {
    return true;
  }
  if (filter === 'unread') {
    return item.unread;
  }
  if (filter === 'community') {
    return item.category === 'community';
  }
  if (filter === 'updates') {
    return (
      FILTER_KINDS.updates?.includes(item.kind) ||
      (item.kind === 'broadcast' && item.category !== 'community')
    );
  }
  return Boolean(FILTER_KINDS[filter]?.includes(item.kind));
}

export type NotificationSection = { title: string; items: AppNotification[] };

const DAY = 86_400_000;

function bucket(iso: string, now: Date): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return 'Earlier';
  }
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = then.getTime();
  if (time >= startOfToday) {
    return 'Today';
  }
  if (time >= startOfToday - DAY) {
    return 'Yesterday';
  }
  if (time >= startOfToday - 6 * DAY) {
    return 'This week';
  }
  if (time >= startOfToday - 29 * DAY) {
    return 'This month';
  }
  return 'Earlier';
}

/**
 * API order is newest first, so sections come out in reading order.
 */
export function groupNotifications(items: AppNotification[]): NotificationSection[] {
  const now = new Date();
  const sections: NotificationSection[] = [];
  items.forEach((item) => {
    const title = bucket(item.createdAt, now);
    const last = sections[sections.length - 1];
    if (last && last.title === title) {
      last.items.push(item);
    } else {
      sections.push({ title, items: [item] });
    }
  });
  return sections;
}

/** "2m", "3h", "4d", "2w", then "6 Oct". */
export function compactTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return '';
  }
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  if (days < 28) {
    return `${Math.floor(days / 7)}w`;
  }
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
