/**
 * Zustand persist adapter backed by MMKV (sync, no hydration flicker).
 */

import type { StateStorage } from 'zustand/middleware';

import { storage } from '@/shared/storage/mmkv';

export const zustandStorage: StateStorage = {
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    storage.setString(name, value);
  },
  removeItem: (name) => {
    storage.remove(name);
  },
};
