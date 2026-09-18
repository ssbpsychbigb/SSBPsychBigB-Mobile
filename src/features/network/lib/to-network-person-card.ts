/**
 * Maps API suggestions onto the Network person card model.
 */

import type { NetworkPersonPreview } from '@/features/network/data/network-preview';
import { roleHeadline, suggestionWhy } from '@/features/network/lib/network-display';
import type { NetworkMember } from '@/features/network/types/network.types';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { formatCount } from '@/features/feed/lib/to-feed-card-post';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

const COLORS = ['#1351A1', '#1667CF', '#1877F2', '#CC5800', '#0E2B50'];

function kindFromRole(role: string): NetworkPersonPreview['kind'] {
  if (role === 'defence_officer') {
    return 'officer';
  }
  if (role === 'educator') {
    return 'educator';
  }
  if (role === 'institute' || role === 'institute_admin') {
    return 'institute';
  }
  return 'aspirant';
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index)) % COLORS.length;
  }
  return COLORS[hash] ?? '#1351A1';
}

/**
 * Card-ready person from `/profile/me/suggestions`.
 */
export function toNetworkPersonCard(person: NetworkMember): NetworkPersonPreview {
  const name = person.fullName?.trim() || person.username || 'Member';
  return {
    id: person.id,
    name,
    role: roleHeadline(person.role, person.examGoal, person.instituteName),
    headline: suggestionWhy(person),
    initials: getUserInitials(name),
    color: avatarColor(person.id),
    mutual: suggestionWhy(person),
    followersLabel: formatCount(0),
    kind: kindFromRole(person.role),
    verified: (person.verificationLevel ?? 0) >= 2,
    photoUri: resolveUploadUrl(person.profilePhotoPath) || undefined,
    followingAuthor: Boolean(person.followingAuthor),
    followsYou: Boolean(person.followsYou),
    username: person.username?.trim() || undefined,
  };
}
