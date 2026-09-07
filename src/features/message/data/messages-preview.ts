/**
 * Preview inbox threads for the Messages UI (API wiring lands with Chat).
 */

export type InboxThreadKind = 'direct' | 'community';

export type InboxFilterKey = 'all' | InboxThreadKind;

export type InboxThreadPreview = {
  id: string;
  name: string;
  initials: string;
  color: string;
  roleLabel: string;
  lastMessage: string;
  timeLabel: string;
  unread: number;
  kind: InboxThreadKind;
  online?: boolean;
};

export const INBOX_FILTERS: { key: InboxFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'direct', label: 'Direct' },
  { key: 'community', label: 'Community' },
];

export const INBOX_THREADS_PREVIEW: InboxThreadPreview[] = [
  {
    id: 't1',
    name: 'Capt. Vikram Rao',
    initials: 'VR',
    color: '#1351A1',
    roleLabel: 'Psychology mentor',
    lastMessage: 'Your TAT hero beat is clear. Tighten the decision line.',
    timeLabel: '2m',
    unread: 2,
    kind: 'direct',
    online: true,
  },
  {
    id: 't2',
    name: 'SSB Psychology Lab',
    initials: 'PL',
    color: '#1667CF',
    roleLabel: 'Community',
    lastMessage: 'Meera: WAT round starts at 2100. Keep answers short.',
    timeLabel: '18m',
    unread: 6,
    kind: 'community',
    online: true,
  },
  {
    id: 't3',
    name: 'Meera Sharma',
    initials: 'MS',
    color: '#0E2B50',
    roleLabel: 'GTO coach',
    lastMessage: 'Assign roles before the plank. Silence is not leadership.',
    timeLabel: '1h',
    unread: 0,
    kind: 'direct',
    online: true,
  },
  {
    id: 't4',
    name: 'GTO Ground Circle',
    initials: 'GG',
    color: '#1877F2',
    roleLabel: 'Community',
    lastMessage: 'Arjun: PGT clip from yesterday is in Reels.',
    timeLabel: 'Yesterday',
    unread: 1,
    kind: 'community',
  },
  {
    id: 't5',
    name: 'Valour Institute',
    initials: 'VI',
    color: '#CC5800',
    roleLabel: 'SSB academy',
    lastMessage: 'Interview hot-seat: why defence — not a script.',
    timeLabel: 'Yesterday',
    unread: 0,
    kind: 'direct',
  },
  {
    id: 't6',
    name: 'Arjun Kulkarni',
    initials: 'AK',
    color: '#1351A1',
    roleLabel: 'Aspirant mentor',
    lastMessage: 'SRT close with action and accountability.',
    timeLabel: 'Tue',
    unread: 0,
    kind: 'direct',
  },
];
