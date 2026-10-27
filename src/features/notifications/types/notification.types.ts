/**
 * In-app notifications — same envelope as web (`GET /notifications`).
 */

export type NotificationKind =
  | 'follow'
  | 'like'
  | 'comment'
  | 'reply'
  | 'mention'
  | 'share'
  | 'broadcast'
  | 'reminder'
  | 'course'
  | 'assessment'
  | 'moderation'
  | 'group';

export type NotificationActor = {
  id?: string;
  name: string;
  username?: string;
  kind: 'person' | 'institute' | 'system';
  /** `/uploads/...` profile photo or institute logo. */
  avatarPath?: string;
};

export type NotificationAction = {
  id: 'follow_back' | string;
  label: string;
  variant?: string;
};

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  category: string;
  actors: NotificationActor[];
  headline: string;
  detail?: string;
  createdAt: string;
  unread: boolean;
  /** Web path, e.g. `/posts/:id`, `/u/:username`, `/c/:slug`. */
  href: string;
  actions: NotificationAction[];
};

export type NotificationPage = {
  items: AppNotification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
};
