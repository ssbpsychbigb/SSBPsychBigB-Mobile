/**
 * Map community API rows onto compact cards.
 */

import type { Community } from '@/features/community/types/community.types';
import { formatCount } from '@/features/feed/lib/to-feed-card-post';
import { resolveUploadUrl } from '@/shared/lib/resolve-upload-url';

export type CommunityCardModel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  memberLabel: string;
  visibilityLabel: string;
  isPrivate: boolean;
  isMember: boolean;
  isPending: boolean;
  coverUri: string | null;
  avatarUri: string | null;
  initials: string;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return 'C';
  }
  if (parts.length === 1) {
    return (parts[0] ?? 'C').slice(0, 2).toUpperCase();
  }
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase() || 'C';
}

/**
 * Card-ready club for discover / my-clubs rails.
 */
export function toCommunityCard(community: Community): CommunityCardModel {
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    description: community.description || '',
    memberLabel: `${formatCount(community.memberCount)} members`,
    visibilityLabel: community.visibility === 'private' ? 'Private' : 'Public',
    isPrivate: community.visibility === 'private',
    isMember: community.isMember,
    isPending: community.membershipStatus === 'pending',
    coverUri: resolveUploadUrl(community.coverPhotoPath),
    avatarUri: resolveUploadUrl(community.avatarPath),
    initials: initialsFromName(community.name),
  };
}
