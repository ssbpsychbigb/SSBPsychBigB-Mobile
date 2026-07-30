/**
 * Auth stack entry route for this process lifetime.
 * Splash is only for cold unauthenticated launch — not after sign-out.
 */

import type { AuthStackParamList } from '@/app/navigation/types';

type AuthEntryRoute = keyof Pick<AuthStackParamList, 'Splash' | 'Login'>;

let preferAuthSplash = true;

/**
 * Initial auth screen: Splash on first cold open, Login after a session ends.
 */
export function getAuthInitialRoute(): AuthEntryRoute {
  return preferAuthSplash ? 'Splash' : 'Login';
}

/**
 * Marks splash as consumed so remounts (e.g. after logout) skip it.
 */
export function markAuthSplashComplete(): void {
  preferAuthSplash = false;
}

/**
 * Skips splash when leaving an authenticated session (logout / forced clear).
 */
export function skipAuthSplashOnNextEntry(): void {
  preferAuthSplash = false;
}
