/**
 * Email display helpers for verification UI.
 */

/**
 * Masks an email for banners (r***@gmail.com).
 */
export function maskEmail(email: string | undefined | null): string {
  const value = String(email || '')
    .trim()
    .toLowerCase();
  const at = value.indexOf('@');

  if (at < 1 || at === value.length - 1) {
    return 'your email';
  }

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${local.slice(0, 1)}***@${domain}`;
}

/**
 * True when the signed-in user still needs the verify-email reminder.
 */
export function needsEmailVerification(
  user: { email?: string; isEmailVerified?: boolean } | null | undefined,
): boolean {
  if (!user?.email) {
    return false;
  }

  return user.isEmailVerified !== true;
}
