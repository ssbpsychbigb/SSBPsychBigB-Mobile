/**
 * Shared context so feature screens can jump between app tabs.
 */

import { createContext, useContext } from 'react';

import type { AppTabRouteKey } from '@/app/navigation/types';

export type AppTabsContextValue = {
  index: number;
  jumpTo: (key: AppTabRouteKey) => void;
  activeKey: AppTabRouteKey;
  /** Full-screen Reels player is open over the explore grid. */
  reelsPlayerOpen: boolean;
  setReelsPlayerOpen: (open: boolean) => void;
  /** Feed Video chip asks Reels to open the composer. */
  reelComposeNonce: number;
  requestReelCompose: () => void;
};

const AppTabsContext = createContext<AppTabsContextValue | null>(null);

export const AppTabsProvider = AppTabsContext.Provider;

/**
 * Access tab jump API from any signed-in screen.
 */
export function useAppTabs(): AppTabsContextValue {
  const value = useContext(AppTabsContext);

  if (!value) {
    throw new Error('useAppTabs must be used within AppNavigator.');
  }

  return value;
}
