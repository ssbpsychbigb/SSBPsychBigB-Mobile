/**
 * Runtime app configuration.
 */

import { resolveApiBaseUrl } from '@/shared/api/resolve-api-base-url';

export const APP_CONFIG = {
  /** Display name shown in UI chrome. */
  appName: 'BIGB',
  /** Semantic app version (keep in sync with native build when shipping). */
  appVersion: '0.0.1',
  /**
   * Versioned backend base URL (no trailing slash).
   * From gitignored `.env` — LOCAL in debug, PRODUCTION in release.
   */
  apiBaseUrl: resolveApiBaseUrl(),
  /**
   * Request timeout. Render free-tier cold start can exceed 30s (web has no abort).
   */
  apiTimeoutMs: 90_000,
  /** OTP digit count (must match backend OTP_LENGTH). */
  otpLength: 6,
  /** Default query stale time for TanStack Query. */
  queryStaleTimeMs: 60_000,
} as const;

export type AppConfig = typeof APP_CONFIG;
