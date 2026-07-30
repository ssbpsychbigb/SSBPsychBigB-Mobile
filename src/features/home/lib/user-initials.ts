/**
 * Builds avatar initials from a display name.
 */

/**
 * Returns up to two uppercase initials from a full name.
 */
export function getUserInitials(fullName: string | undefined | null): string {
  const parts = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const first = parts[0];
  const last = parts[parts.length - 1];

  if (!first) {
    return 'B';
  }

  if (parts.length === 1 || !last) {
    return first.slice(0, 2).toUpperCase();
  }

  const a = first[0] ?? '';
  const b = last[0] ?? '';
  return `${a}${b}`.toUpperCase() || 'B';
}
