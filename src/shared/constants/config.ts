/**
 * Runtime app configuration.
 * Replace DEV_LAN_IP / ANDROID_USE_EMULATOR when switching targets.
 */

import { Platform } from 'react-native';

/** PC Wi‑Fi IPv4 — used by physical Android/iOS devices on the same LAN. */
const DEV_LAN_IP = '192.168.29.171';

/**
 * true  → Android emulator loopback (10.0.2.2 → host localhost)
 * false → physical device / USB (LAN IP; also works with `adb reverse`)
 */
const ANDROID_USE_EMULATOR = false;

function resolveDevApiBaseUrl(): string {
  if (Platform.OS === 'android') {
    const host = ANDROID_USE_EMULATOR ? '10.0.2.2' : DEV_LAN_IP;
    return `http://${host}:5000/api/v1`;
  }

  // * iOS simulator can use localhost; physical iPhone needs DEV_LAN_IP.
  return `http://${DEV_LAN_IP}:5000/api/v1`;
}

export const APP_CONFIG = {
  /** Display name shown in UI chrome. */
  appName: 'BIGB',
  /** Semantic app version (keep in sync with native build when shipping). */
  appVersion: '0.0.1',
  /**
   * Versioned backend base URL (no trailing slash).
   * Local backend is expected on port 5000.
   */
  apiBaseUrl: resolveDevApiBaseUrl(),
  /** Request timeout in milliseconds. */
  apiTimeoutMs: 30_000,
  /** OTP digit count (must match backend OTP_LENGTH). */
  otpLength: 6,
  /** Default query stale time for TanStack Query. */
  queryStaleTimeMs: 60_000,
} as const;

export type AppConfig = typeof APP_CONFIG;
