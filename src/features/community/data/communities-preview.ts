/**
 * Community circles preview.
 */

export type CommunityPreview = {
  id: string;
  name: string;
  members: string;
  focus: string;
  initials: string;
  color: string;
};

export const COMMUNITIES_PREVIEW: CommunityPreview[] = [
  {
    id: 'c1',
    name: 'SSB Psychology Lab',
    members: '1.8K members',
    focus: 'TAT · WAT · SRT',
    initials: 'PL',
    color: '#1351A1',
  },
  {
    id: 'c2',
    name: 'GTO Ground Circle',
    members: '940 members',
    focus: 'PGT · HGT · Command',
    initials: 'GG',
    color: '#1667CF',
  },
  {
    id: 'c3',
    name: 'NDA / CDS Current Affairs',
    members: '3.2K members',
    focus: 'Daily brief',
    initials: 'CA',
    color: '#0E2B50',
  },
];
