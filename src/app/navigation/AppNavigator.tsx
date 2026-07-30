/**
 * Authenticated app shell — swipe tabs via react-native-tab-view + pager-view.
 */

import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneMap, TabView } from 'react-native-tab-view';

import { AppTabsProvider } from '@/app/navigation/AppTabsContext';
import {
  CustomFloatingTabBar,
  FAB_LIFT,
  FAB_SIZE,
  TAB_BAR_BASE_HEIGHT,
} from '@/app/navigation/CustomFloatingTabBar';
import type { AppTabRoute, AppTabRouteKey } from '@/app/navigation/types';
import { BookmarkScreen } from '@/features/bookmark';
import { HomeScreen } from '@/features/home';
import { LearnScreen } from '@/features/learn';
import { MessageScreen } from '@/features/message';
import { ProfileScreen } from '@/features/profile';
import { vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';

const ROUTES: AppTabRoute[] = [
  { key: 'homepage', title: 'Home' },
  { key: 'bookmark', title: 'Bookmark' },
  { key: 'myCourse', title: 'My Course' },
  { key: 'message', title: 'Message' },
  { key: 'profile', title: 'Profile' },
];

const renderScene = SceneMap({
  homepage: HomeScreen,
  bookmark: BookmarkScreen,
  myCourse: LearnScreen,
  message: MessageScreen,
  profile: ProfileScreen,
});

/**
 * Signed-in experience with swipeable pages and overlay floating tab bar.
 * * Tab bar is outside TabView so Android does not clip the center FAB.
 */
export function AppNavigator() {
  const theme = useTheme();
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const jumpTo = useCallback((key: AppTabRouteKey) => {
    const next = ROUTES.findIndex((route) => route.key === key);
    if (next >= 0) {
      setIndex(next);
    }
  }, []);

  const tabsValue = useMemo(
    () => ({
      index,
      jumpTo,
    }),
    [index, jumpTo],
  );

  const bottomChrome =
    FAB_LIFT + TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, vs(8));

  return (
    <AppTabsProvider value={tabsValue}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.pagerWrap, { paddingBottom: bottomChrome - FAB_SIZE / 2 }]}>
          <TabView
            navigationState={{ index, routes: ROUTES }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            renderTabBar={() => null}
            initialLayout={{ width: layout.width }}
            swipeEnabled
            style={styles.tabView}
          />
        </View>

        <View pointerEvents="box-none" style={styles.tabBarOverlay}>
          <CustomFloatingTabBar
            jumpTo={(key) => jumpTo(key as AppTabRouteKey)}
            messageHasUnread
            navigationState={{ index, routes: ROUTES }}
          />
        </View>
      </View>
    </AppTabsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pagerWrap: {
    flex: 1,
  },
  tabView: {
    flex: 1,
  },
  tabBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 50,
  },
});
