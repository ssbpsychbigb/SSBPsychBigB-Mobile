/**
 * Inbox row view-model and filter chips.
 */

export type InboxThreadKind = 'direct' | 'community';

export type InboxFolder = 'focused' | 'other';

export type InboxFilterKey = 'primary' | 'requests' | 'starred';

export type InboxThreadPreview = {
  id: string;
  name: string;
  username?: string;
  initials: string;
  color: string;
  roleLabel: string;
  lastMessage: string;
  timeLabel: string;
  unread: number;
  kind: InboxThreadKind;
  folder: InboxFolder;
  youBlocked?: boolean;
  blockedByPeer?: boolean;
  online?: boolean;
  starred?: boolean;
};

export const INBOX_FILTERS: { key: InboxFilterKey; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'requests', label: 'Requests' },
  { key: 'starred', label: 'Starred' },
];
