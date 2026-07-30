/**
 * Typed MMKV instance wrapper.
 * Features must import from this module — never createMMKV directly.
 */

import { createMMKV } from 'react-native-mmkv';

export const mmkv = createMMKV({ id: 'bigb.storage' });

/**
 * Synchronous key-value storage helpers.
 */
export const storage = {
  getString: (key: string): string | undefined => mmkv.getString(key),
  setString: (key: string, value: string): void => {
    mmkv.set(key, value);
  },
  getBoolean: (key: string): boolean | undefined => mmkv.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => {
    mmkv.set(key, value);
  },
  getNumber: (key: string): number | undefined => mmkv.getNumber(key),
  setNumber: (key: string, value: number): void => {
    mmkv.set(key, value);
  },
  remove: (key: string): void => {
    mmkv.remove(key);
  },
  contains: (key: string): boolean => mmkv.contains(key),
  clearAll: (): void => {
    mmkv.clearAll();
  },
} as const;
