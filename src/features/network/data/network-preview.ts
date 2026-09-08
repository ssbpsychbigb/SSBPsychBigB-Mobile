/**
 * People-you-may-know preview for Network.
 */

export type NetworkKind = 'officer' | 'educator' | 'institute' | 'circle';

export type NetworkFilterKey = 'all' | NetworkKind;

export type NetworkPersonPreview = {
  id: string;
  name: string;
  role: string;
  headline: string;
  initials: string;
  color: string;
  mutual: string;
  followersLabel: string;
  kind: NetworkKind;
  verified?: boolean;
  featured?: boolean;
};

export const NETWORK_FILTERS: { key: NetworkFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'officer', label: 'Officers' },
  { key: 'educator', label: 'Educators' },
  { key: 'institute', label: 'Institutes' },
  { key: 'circle', label: 'Circles' },
];

export const NETWORK_KIND_LABEL: Record<NetworkKind, string> = {
  officer: 'Officer',
  educator: 'Educator',
  institute: 'Institute',
  circle: 'Circle',
};

export const NETWORK_PREVIEW: NetworkPersonPreview[] = [
  {
    id: 'n1',
    name: 'Capt. Vikram Rao',
    role: 'Defence officer · Psychology',
    headline: 'TAT, WAT, and interview calm — officer language, not slogans.',
    initials: 'VR',
    color: '#1351A1',
    mutual: '12 in your circle',
    followersLabel: '4.2k',
    kind: 'officer',
    verified: true,
    featured: true,
  },
  {
    id: 'n2',
    name: 'Meera Sharma',
    role: 'Educator · GTO',
    headline: 'PGT voice, roles, and 12-second plans before the plank.',
    initials: 'MS',
    color: '#1667CF',
    mutual: 'Suggested for SSB',
    followersLabel: '1.8k',
    kind: 'educator',
    verified: true,
  },
  {
    id: 'n3',
    name: 'Valour Institute',
    role: 'Institute · Bangalore',
    headline: 'Interview hot-seat and batch briefs for NDA / CDS aspirants.',
    initials: 'VI',
    color: '#0E2B50',
    mutual: '248 following this academy',
    followersLabel: '12.4k',
    kind: 'institute',
    verified: true,
  },
  {
    id: 'n4',
    name: 'NCC Hub',
    role: 'Community lead',
    headline: 'Cadet-to-SSB circle. Daily drill notes and current affairs.',
    initials: 'NH',
    color: '#CC5800',
    mutual: 'Prep circle',
    followersLabel: '3.1k',
    kind: 'circle',
  },
  {
    id: 'n5',
    name: 'Arjun Kulkarni',
    role: 'Aspirant mentor · SRT',
    headline: 'SRT endings that sound like an officer — action, then account.',
    initials: 'AK',
    color: '#1877F2',
    mutual: '8 mutual',
    followersLabel: '956',
    kind: 'educator',
  },
];
