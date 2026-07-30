/**
 * Human-readable labels for auth roles on mobile.
 */

import type { AuthRole } from '@/features/auth/types/auth.types';

const ROLE_LABELS: Record<AuthRole, string> = {
  aspirant: 'Student',
  institute: 'Institute',
  institute_admin: 'Institute admin',
  educator: 'Educator',
  defence_officer: 'Defence officer',
};

/**
 * Maps an auth role to UI copy.
 */
export function getRoleLabel(role: AuthRole | undefined): string {
  if (!role) {
    return 'Member';
  }

  return ROLE_LABELS[role] ?? 'Member';
}
