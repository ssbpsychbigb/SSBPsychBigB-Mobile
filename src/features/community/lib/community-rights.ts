/**
 * Co-Admin checkbox catalog — Primary grants these one by one.
 */

export const CO_ADMIN_RIGHT_KEYS = [
  'canEditSettings',
  'canChangeVisibility',
  'canManageMembers',
  'canAnnounce',
  'canModerateContent',
  'canEditAnyContent',
  'canManageResources',
  'canManageEvents',
  'canViewAnalytics',
  'canProposeArchive',
  'canProposeDelete',
] as const;

export type CoAdminRightKey = (typeof CO_ADMIN_RIGHT_KEYS)[number];

export type CoAdminRights = Record<CoAdminRightKey, boolean>;

export const CO_ADMIN_RIGHT_COPY: Record<
  CoAdminRightKey,
  { label: string; hint: string }
> = {
  canEditSettings: {
    label: 'Edit club profile',
    hint: 'Name, cover, description, and rules',
  },
  canChangeVisibility: {
    label: 'Change visibility',
    hint: 'Public ↔ private after create',
  },
  canManageMembers: {
    label: 'Manage members',
    hint: 'Approve joins, mute, and remove members',
  },
  canAnnounce: {
    label: 'Post announcements',
    hint: 'Official club notices',
  },
  canModerateContent: {
    label: 'Moderate posts',
    hint: 'Pin, hide, or remove others’ posts',
  },
  canEditAnyContent: {
    label: 'Edit any post',
    hint: 'Rewrite others’ content — grant carefully',
  },
  canManageResources: {
    label: 'Manage files',
    hint: 'Upload and remove club files',
  },
  canManageEvents: {
    label: 'Manage events',
    hint: 'Create and cancel events',
  },
  canViewAnalytics: {
    label: 'View analytics',
    hint: 'Club stats dashboard',
  },
  canProposeArchive: {
    label: 'Propose archive',
    hint: 'One of two keys to archive the club',
  },
  canProposeDelete: {
    label: 'Propose delete',
    hint: 'One of two keys to delete the club',
  },
};

/**
 * @param rights Existing flags from the API
 */
export function emptyCoAdminRights(
  rights?: Record<string, boolean> | null,
): CoAdminRights {
  const next = {} as CoAdminRights;
  CO_ADMIN_RIGHT_KEYS.forEach((key) => {
    next[key] = Boolean(rights?.[key]);
  });
  return next;
}

/**
 * @param role Membership role
 */
export function clubSeatLabel(role: string | null | undefined) {
  if (role === 'owner' || role === 'primary_admin') {
    return 'Primary';
  }
  if (role === 'co_admin' || role === 'moderator') {
    return 'Co-Admin';
  }
  return 'Member';
}

/**
 * @param role Membership role
 */
export function isPrimarySeat(role: string | null | undefined) {
  return role === 'owner' || role === 'primary_admin';
}

/**
 * @param role Membership role
 */
export function isCoAdminSeat(role: string | null | undefined) {
  return role === 'co_admin' || role === 'moderator';
}
