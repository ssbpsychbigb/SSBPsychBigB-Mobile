/**
 * Who may create a community (mirrors web + backend Layer A).
 */

import type { AuthUser } from '@/features/auth/types/auth.types';
import type { Community } from '@/features/community/types/community.types';

const CREATE_ROLES = new Set([
  'educator',
  'institute',
  'institute_admin',
  'defence_officer',
]);

/**
 * Institute educator needs `community.create`. Officers and freelancer educators may create.
 */
export function canCreateCommunity(user: AuthUser | null | undefined): boolean {
  const role = String(user?.role || '');
  if (!CREATE_ROLES.has(role)) {
    return false;
  }
  if (role === 'educator' && user?.instituteId) {
    return (user.permissions || []).includes('community.create');
  }
  return true;
}

/**
 * Public clubs can be browsed without joining. Private clubs stay locked.
 */
export function canPreviewClubContent(community: Community | null | undefined): boolean {
  if (!community) {
    return false;
  }
  if (community.isMember) {
    return true;
  }
  if (community.status === 'pending_approval') {
    return false;
  }
  return community.visibility === 'public';
}

/**
 * Approved member who has accepted house rules (or none set).
 */
export function canActInClub(community: Community | null | undefined): boolean {
  return Boolean(
    community?.isMember &&
      community.status !== 'pending_approval' &&
      !community.needsRulesAccept,
  );
}
