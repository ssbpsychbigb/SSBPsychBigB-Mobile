/**
 * Tab actions stay on a separate context so Feed does not re-render on tab change.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';

import type { AppTabRouteKey } from '@/app/navigation/types';

export type AppTabsContextValue = {
  jumpTo: (key: AppTabRouteKey) => void;
  activeKey: AppTabRouteKey;
  /** Full-screen Reels player is open over the explore grid. */
  reelsPlayerOpen: boolean;
  setReelsPlayerOpen: (open: boolean) => void;
  /** Feed Video chip asks Reels to open the composer. */
  reelComposeNonce: number;
  requestReelCompose: () => void;
};

type AppTabsActions = Pick<
  AppTabsContextValue,
  'jumpTo' | 'setReelsPlayerOpen' | 'requestReelCompose'
>;

type AppTabsState = Pick<
  AppTabsContextValue,
  'activeKey' | 'reelsPlayerOpen' | 'reelComposeNonce'
>;

const AppTabsActionsContext = createContext<AppTabsActions | null>(null);
const AppTabsStateContext = createContext<AppTabsState | null>(null);

export function AppTabsProvider({
  children,
  jumpTo,
  setReelsPlayerOpen,
  requestReelCompose,
  activeKey,
  reelsPlayerOpen,
  reelComposeNonce,
}: {
  children: ReactNode;
} & AppTabsContextValue) {
  const actions = useMemo(
    () => ({ jumpTo, setReelsPlayerOpen, requestReelCompose }),
    [jumpTo, requestReelCompose, setReelsPlayerOpen],
  );
  const state = useMemo(
    () => ({ activeKey, reelsPlayerOpen, reelComposeNonce }),
    [activeKey, reelsPlayerOpen, reelComposeNonce],
  );

  return (
    <AppTabsActionsContext.Provider value={actions}>
      <AppTabsStateContext.Provider value={state}>
        {children}
      </AppTabsStateContext.Provider>
    </AppTabsActionsContext.Provider>
  );
}

/**
 * Jump to a root tab from Feed, Profile, or Workspace.
 */
export function useJumpToAppTab() {
  const navigation = useNavigation();
  return useCallback(
    (key: AppTabRouteKey) => {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'App',
          params: { screen: key },
        }),
      );
    },
    [navigation],
  );
}

export function useAppTabsActions() {
  const value = useContext(AppTabsActionsContext);
  const fallbackJump = useJumpToAppTab();
  if (!value) {
    return {
      jumpTo: fallbackJump,
      setReelsPlayerOpen: () => undefined,
      requestReelCompose: () => undefined,
    };
  }
  return value;
}

export function useAppTabsState() {
  const value = useContext(AppTabsStateContext);
  if (!value) {
    return {
      activeKey: 'homepage' as AppTabRouteKey,
      reelsPlayerOpen: false,
      reelComposeNonce: 0,
    };
  }
  return value;
}

/**
 * Access tab jump API from any signed-in screen.
 */
export function useAppTabs(): AppTabsContextValue {
  const actions = useAppTabsActions();
  const state = useAppTabsState();
  return { ...actions, ...state };
}
