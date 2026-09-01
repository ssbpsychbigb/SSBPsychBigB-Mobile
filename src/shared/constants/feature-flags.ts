/**
 * App-wide feature flags (mobile).
 * Keep in sync with backend / web flags where relevant.
 */

export const FEATURE_FLAGS = {
  /** Public freelancer educator registration flow. */
  educatorFreelancerRegister: true,
  /** Enable dark theme toggle in settings. */
  themeToggle: true,
  /** Show OTP on-device when backend exposes it (dev only). */
  exposeOtpInDev: true,
  /**
   * Google Sign-In (AUTH-003). UI can show the button when true;
   * native SDK + backend merge not wired yet.
   */
  googleSignIn: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
