/**
 * App-portal post-auth routing helpers (mobile parity with web auth-routing).
 */

import type { AuthUser } from '@/features/auth/types/auth.types';
import { isOnboardingComplete } from '@/features/auth/lib/onboarding-storage';

const BLOCKED_STATUSES = new Set(['suspended', 'banned', 'deleted']);

/**
 * Institute collab statuses where the educator may stay in institute context.
 * Matches backend ENTERABLE_COLLAB_STATUSES (leave/resign pending still "inside").
 */
const ENTERABLE_INSTITUTE_PROFILE_STATUSES = new Set([
  'active',
  'leave_pending',
  'on_leave',
  'resign_pending',
  'notice_period',
]);

/** Root stack destinations after session is known. */
export type PostAuthDestination =
  | 'auth'
  | 'underReview'
  | 'applicationRejected'
  | 'restricted'
  | 'onboarding'
  | 'app';

/**
 * True when the account must not use the app portal.
 */
export function isAppAccountBlocked(
  user: AuthUser | null | undefined,
): boolean {
  if (!user) {
    return false;
  }

  return BLOCKED_STATUSES.has(user.accountStatus);
}

/**
 * Active institute EducatorProfile for a freelancer (collab context).
 * Includes leave/resign/notice states — still entered, not ended.
 */
export function getActiveInstituteProfile(
  user: AuthUser | null | undefined,
) {
  if (!user?.activeProfile) {
    return null;
  }

  if (
    user.activeProfile.type === 'institute' &&
    ENTERABLE_INSTITUTE_PROFILE_STATUSES.has(user.activeProfile.status)
  ) {
    return user.activeProfile;
  }

  return null;
}

/**
 * Freelancer brand profile id — used to leave institute context.
 */
export function getFreelancerProfileId(
  user: AuthUser | null | undefined,
): string | null {
  if (!user?.profiles?.length) {
    return null;
  }

  return (
    user.profiles.find(
      (row) => row.type === 'freelancer' && row.status === 'active',
    )?.id || null
  );
}

/**
 * True when a freelancer educator is currently working inside an institute.
 */
export function isEducatorInInstituteContext(
  user: AuthUser | null | undefined,
): boolean {
  return Boolean(getActiveInstituteProfile(user) && getFreelancerProfileId(user));
}

/**
 * True when the signed-in user owns / admins the institute ops panel.
 * Freelancer educators in collab context are NOT owners.
 */
export function isInstituteOwnerUser(
  user: AuthUser | null | undefined,
): boolean {
  if (!user) {
    return false;
  }

  return user.role === 'institute' || user.role === 'institute_admin';
}

/**
 * True when the user belongs to the institute ops surface.
 */
export function isInstitutePanelUser(
  user: AuthUser | null | undefined,
): boolean {
  if (!user) {
    return false;
  }

  if (isInstituteOwnerUser(user)) {
    return true;
  }

  if (user.role === 'educator' && user.instituteId) {
    return true;
  }

  return Boolean(getActiveInstituteProfile(user));
}

/**
 * Approved freelancer (personal brand) — no legacy faculty instituteId.
 */
export function isFreelancerEducator(
  user: AuthUser | null | undefined,
): boolean {
  if (!user || user.role !== 'educator' || user.instituteId) {
    return false;
  }

  return user.accountStatus === 'active';
}

/**
 * True when rejected applicants may open the resubmit flow.
 */
export function canResubmitApplication(
  user: AuthUser | null | undefined,
): boolean {
  if (!user || user.accountStatus !== 'rejected') {
    return false;
  }

  return (
    user.role === 'institute' ||
    user.role === 'defence_officer' ||
    user.role === 'educator'
  );
}

/**
 * Active aspirants need guided onboarding once after first login.
 */
export function needsAspirantOnboarding(
  user: AuthUser | null | undefined,
): boolean {
  if (!user || user.role !== 'aspirant' || user.accountStatus !== 'active') {
    return false;
  }

  return !isOnboardingComplete(user.id);
}

/**
 * Landing destination after a successful app OTP / session refresh.
 */
export function getPostAuthDestination(
  user: AuthUser | null | undefined,
): PostAuthDestination {
  if (!user) {
    return 'auth';
  }

  if (isAppAccountBlocked(user)) {
    return 'auth';
  }

  if (user.accountStatus === 'pending_verification') {
    return 'underReview';
  }

  if (user.accountStatus === 'rejected') {
    return 'applicationRejected';
  }

  if (user.accountStatus === 'restricted') {
    return 'restricted';
  }

  if (needsAspirantOnboarding(user)) {
    return 'onboarding';
  }

  return 'app';
}
