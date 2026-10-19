/**
 * Network card view-model and filter chips.
 */

export type NetworkKind = 'officer' | 'educator' | 'institute' | 'aspirant';

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
  photoUri?: string;
  followingAuthor?: boolean;
  followsYou?: boolean;
  username?: string;
};

export const NETWORK_FILTERS: { key: NetworkFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'officer', label: 'Officers' },
  { key: 'educator', label: 'Educators' },
  { key: 'institute', label: 'Institutes' },
  { key: 'aspirant', label: 'Aspirants' },
];

export const NETWORK_KIND_LABEL: Record<NetworkKind, string> = {
  officer: 'Officer',
  educator: 'Educator',
  institute: 'Institute',
  aspirant: 'Aspirant',
};
