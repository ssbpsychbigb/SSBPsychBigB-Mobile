/**
 * Maps the web `href` on a notification to a mobile screen.
 */

import type { AppTabRouteKey, RootStackParamList } from '@/app/navigation/types';
import type { AppNotification } from '@/features/notifications/types/notification.types';

export type NotificationTarget =
  | {
      type: 'root';
      name: keyof RootStackParamList;
      params?: RootStackParamList[keyof RootStackParamList];
    }
  | { type: 'tab'; key: AppTabRouteKey }
  | null;

const COMMENT_KINDS = new Set(['comment', 'reply', 'mention']);

/**
 * Null when the notification has nothing to open (system notice, missing id).
 */
export function notificationTarget(item: AppNotification): NotificationTarget {
  const path = String(item.href || '').split('?')[0]?.replace(/\/+$/, '') || '';
  const parts = path.split('/').filter(Boolean);
  const [head, id, sub] = parts;

  switch (head) {
    case 'posts':
      return id
        ? {
            type: 'root',
            name: 'PostDetail',
            params: { postId: id, openComments: COMMENT_KINDS.has(item.kind) },
          }
        : null;
    case 'u':
      return id ? { type: 'root', name: 'MemberProfile', params: { username: id } } : null;
    case 'c':
      return id ? { type: 'root', name: 'ClubHome', params: { slug: id } } : null;
    case 'communities':
      return { type: 'tab', key: 'communities' };
    case 'learn':
      if (id === 'courses' && sub) {
        return { type: 'root', name: 'CourseDetail', params: { slug: sub } };
      }
      return { type: 'tab', key: 'myCourse' };
    case 'assessments':
      return id
        ? { type: 'root', name: 'AssessmentDetail', params: { slug: id } }
        : { type: 'tab', key: 'myCourse' };
    case 'profile':
      return { type: 'tab', key: 'profile' };
    default:
      return null;
  }
}
