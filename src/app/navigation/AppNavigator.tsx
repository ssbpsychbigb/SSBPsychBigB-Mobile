/**
 * Authenticated app shell — tab bar switches pages (swipe between tabs is off).
 */

import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SceneMap, TabView } from 'react-native-tab-view';

import { AppTabsProvider } from '@/app/navigation/AppTabsContext';
import {
  CustomFloatingTabBar,
  FAB_LIFT,
  FAB_SIZE,
  TAB_BAR_BASE_HEIGHT,
} from '@/app/navigation/CustomFloatingTabBar';
import type { AppTabRoute, AppTabRouteKey, RootStackParamList } from '@/app/navigation/types';
import { CommunitiesScreen } from '@/features/community';
import { FeedScreen } from '@/features/feed';
import { LearnScreen } from '@/features/learn';
import { ProfileScreen } from '@/features/profile';
import { ReelsScreen } from '@/features/reels';
import { vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { ImmersiveStatusBar } from '@/shared/ui';

const ROUTES: AppTabRoute[] = [
  { key: 'homepage', title: 'Feed' },
  { key: 'reels', title: 'Reels' },
  { key: 'myCourse', title: 'My Course' },
  { key: 'communities', title: 'Community' },
  { key: 'profile', title: 'You' },
];

const renderScene = SceneMap({
  homepage: FeedScreen,
  reels: ReelsScreen,
  myCourse: LearnScreen,
  communities: CommunitiesScreen,
  profile: ProfileScreen,
});

/**
 * Signed-in experience with overlay floating tab bar.
 * * Tab bar is outside TabView so Android does not clip the center FAB.
 * * Horizontal swipe between tabs is disabled so nested lists (Feed, Reels) keep the gesture.
 */
export function AppNavigator() {
  const theme = useTheme();
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'App'>>();
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
      activeKey: ROUTES[index]?.key ?? 'homepage',
    }),
    [index, jumpTo],
  );

  const bottomChrome =
    FAB_LIFT + TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, vs(8));
  const isReels = ROUTES[index]?.key === 'reels';

  useLayoutEffect(() => {
    navigation.setOptions({
      contentStyle: {
        backgroundColor: isReels ? '#000000' : theme.colors.background,
      },
      statusBarStyle: isReels || theme.mode === 'dark' ? 'light' : 'dark',
      statusBarBackgroundColor: 'transparent',
      statusBarTranslucent: true,
    });
  }, [isReels, navigation, theme.colors.background, theme.mode]);

  return (
    <AppTabsProvider value={tabsValue}>
      <ImmersiveStatusBar lightIcons={isReels || theme.mode === 'dark'} />
      <View
        style={[
          styles.root,
          { backgroundColor: isReels ? '#000000' : theme.colors.background },
        ]}>
        <View style={[styles.pagerWrap, { paddingBottom: bottomChrome - FAB_SIZE / 2 }]}>
          <TabView
            navigationState={{ index, routes: ROUTES }}
            onIndexChange={setIndex}
            renderScene={renderScene}
            renderTabBar={() => null}
            initialLayout={{ width: layout.width }}
            swipeEnabled={false}
            style={styles.tabView}
          />
        </View>

        <View pointerEvents="box-none" style={styles.tabBarOverlay}>
          <CustomFloatingTabBar
            hideTopEdge={isReels}
            jumpTo={(key) => jumpTo(key as AppTabRouteKey)}
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
