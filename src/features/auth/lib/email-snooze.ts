/**
 * "Later" on the email banner hides it for 24 hours on this phone.
 */

import { storage } from '@/shared/storage/mmkv';

const DAY_MS = 24 * 60 * 60 * 1000;

function key(userId: string): string {
  return `email-verify-snooze.${userId}`;
}

export function snoozeEmailVerification(userId: string): void {
  storage.setNumber(key(userId), Date.now() + DAY_MS);
}

export function isEmailVerificationSnoozed(userId: string): boolean {
  const until = storage.getNumber(key(userId)) ?? 0;
  return until > Date.now();
}
