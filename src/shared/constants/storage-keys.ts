/**
 * Centralized MMKV / persist key registry.
 * Features must never invent ad-hoc storage keys.
 */

export const StorageKeys = {
  AUTH_SESSION: 'bigb.auth.session',
  THEME_PREFERENCE: 'bigb.theme.preference',
  PERMISSIONS: 'bigb.permissions',
  ONBOARDING_COMPLETE: 'bigb.onboarding.complete',
  DEVICE_ID: 'bigb.device.id',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
