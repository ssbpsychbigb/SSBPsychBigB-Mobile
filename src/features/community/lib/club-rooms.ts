/**
 * Club home rooms.
 */

export type ClubRoomKey =
  | 'feed'
  | 'qa'
  | 'files'
  | 'events'
  | 'news'
  | 'about'
  | 'members'
  | 'requests'
  | 'settings';

export const CLUB_ROOM_LABEL: Record<ClubRoomKey, string> = {
  feed: 'Feed',
  qa: 'Q&A',
  files: 'Files',
  events: 'Events',
  news: 'News',
  about: 'About',
  members: 'Members',
  requests: 'Requests',
  settings: 'Settings',
};
