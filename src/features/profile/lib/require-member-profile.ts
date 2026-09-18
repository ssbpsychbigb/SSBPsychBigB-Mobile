/**
 * Shared MemberProfile navigation — never invent a handle.
 */

import { showToast } from '@/shared/ui/toast';

export type MemberProfileParams = {
  username: string;
  name?: string;
};

/**
 * Returns stack params when username is real; otherwise toasts and returns null.
 */
export function requireMemberProfileParams(
  username?: string | null,
  name?: string,
): MemberProfileParams | null {
  const handle = username?.trim();
  if (!handle) {
    showToast.error(
      'Profile unavailable',
      'This member has no public username yet.',
    );
    return null;
  }
  return { username: handle, name };
}
