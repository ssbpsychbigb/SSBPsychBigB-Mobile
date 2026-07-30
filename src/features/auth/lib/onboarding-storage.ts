/**
 * Aspirant onboarding progress stored per user in MMKV.
 * * Backend institute-link / attemptDate APIs are not shipped yet — local until then.
 */

import { StorageKeys } from '@/shared/constants/storage-keys';
import { storage } from '@/shared/storage/mmkv';
import type { ExamGoalValue } from '@/features/auth/constants/exam-goals';

export type PrepStage =
  | 'just_starting'
  | 'foundation'
  | 'advanced'
  | 'ssb_ready';

export type OnboardingProfile = {
  userId: string;
  examGoal: ExamGoalValue | '';
  instituteCode: string;
  skippedInstituteCode: boolean;
  attemptDate: string;
  prepStage: PrepStage | '';
  completedAt: string;
};

function profileKey(userId: string): string {
  return `${StorageKeys.ONBOARDING_COMPLETE}.${userId}`;
}

/**
 * True when this aspirant finished mobile onboarding.
 */
export function isOnboardingComplete(userId: string | undefined): boolean {
  if (!userId) {
    return false;
  }

  return storage.getBoolean(profileKey(userId)) === true;
}

/**
 * Reads saved onboarding answers (if any).
 */
export function getOnboardingProfile(
  userId: string,
): OnboardingProfile | null {
  const raw = storage.getString(`${profileKey(userId)}.data`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as OnboardingProfile;
  } catch {
    return null;
  }
}

/**
 * Persists onboarding answers and marks the user complete.
 */
export function completeOnboarding(profile: OnboardingProfile): void {
  storage.setString(`${profileKey(profile.userId)}.data`, JSON.stringify(profile));
  storage.setBoolean(profileKey(profile.userId), true);
}

/**
 * Clears onboarding flag (used on logout for clean re-test, optional).
 */
export function clearOnboarding(userId: string | undefined): void {
  if (!userId) {
    return;
  }

  storage.remove(profileKey(userId));
  storage.remove(`${profileKey(userId)}.data`);
}
