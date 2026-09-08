/**
 * Notification inbox preview.
 */

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export const NOTIFICATIONS_PREVIEW: NotificationPreview[] = [
  {
    id: 't1',
    title: 'Capt. Vikram Rao followed you',
    body: 'You are in their prep circle now.',
    time: '2h',
    unread: true,
  },
  {
    id: 't2',
    title: 'Meera Sharma commented',
    body: '“Narrate the plan before anyone lifts a plank.”',
    time: '5h',
    unread: true,
  },
  {
    id: 't3',
    title: 'SSB Psychology Lab',
    body: 'Sunday TAT drill is pinned in the circle.',
    time: '1d',
    unread: false,
  },
];
