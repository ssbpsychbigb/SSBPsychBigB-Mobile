/**
 * Shared context so feature screens can jump between swipe tabs.
 */

import { createContext, useContext } from 'react';

import type { AppTabRouteKey } from '@/app/navigation/types';

export type AppTabsContextValue = {
  index: number;
  jumpTo: (key: AppTabRouteKey) => void;
};

const AppTabsContext = createContext<AppTabsContextValue | null>(null);

export const AppTabsProvider = AppTabsContext.Provider;

/**
 * Access swipe-tab jump API from any signed-in screen.
 */
export function useAppTabs(): AppTabsContextValue {
  const value = useContext(AppTabsContext);

  if (!value) {
    throw new Error('useAppTabs must be used within AppNavigator TabView.');
  }

  return value;
}
