/**
 * Theme preference store + React context provider.
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { StorageKeys } from '@/shared/constants/storage-keys';
import { zustandStorage } from '@/shared/storage/zustand-storage';
import {
  darkTheme,
  lightTheme,
  type AppTheme,
  type ThemeMode,
} from '@/shared/theme/theme';

type ThemeState = {
  preference: ThemeMode;
  setPreference: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: StorageKeys.THEME_PREFERENCE,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

const ThemeContext = createContext<AppTheme>(lightTheme);

export type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Resolves system / user preference into an AppTheme and provides it.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);

  const theme = useMemo<AppTheme>(() => {
    const resolved =
      preference === 'system'
        ? systemScheme === 'dark'
          ? 'dark'
          : 'light'
        : preference;

    return resolved === 'dark' ? darkTheme : lightTheme;
  }, [preference, systemScheme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

/**
 * Access the resolved AppTheme from any screen or component.
 */
export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
