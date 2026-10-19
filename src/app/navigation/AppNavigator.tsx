/**
 * Authenticated app shell — tabs + swipe between Feed, Reels, Course, Community, You.
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type Animated,
} from 'react-native';
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

/** Ignore pager callbacks that report the previous page right after a tap. */
const TAB_PRESS_LOCK_MS = 450;

type PagerPosition = Animated.AnimatedInterpolation<number>;

type PagerBind = {
  jumpTo: (key: string) => void;
  position: PagerPosition;
};

/**
 * Publishes the pager jump + scroll position to the overlay tab bar.
 * The bar stays outside TabView so the center FAB is not clipped.
 */
function TabPagerBridge({
  jumpTo,
  position,
  onBind,
}: PagerBind & { onBind: (bind: PagerBind) => void }) {
  const onBindRef = useRef(onBind);
  onBindRef.current = onBind;

  useLayoutEffect(() => {
    onBindRef.current({ jumpTo, position });
  }, [jumpTo, position]);

  return null;
}

/**
 * Signed-in experience with overlay floating tab bar.
 * * Tab bar is outside TabView so Android does not clip the center FAB.
 * * Programmatic changes snap. The highlight follows pager position, so it
 *   does not wait until the page-settled callback.
 */
export function AppNavigator() {
  const theme = useTheme();
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'App'>>();
  const [index, setIndex] = useState(0);
  const [reelsPlayerOpen, setReelsPlayerOpen] = useState(false);
  const [reelComposeNonce, setReelComposeNonce] = useState(0);
  const [pagerPosition, setPagerPosition] = useState<PagerPosition | null>(null);
  const indexRef = useRef(0);
  const targetRef = useRef(0);
  const suppressStaleUntilRef = useRef(0);
  const pagerJumpRef = useRef<(key: string) => void>(() => {});

  const commitIndex = useCallback((next: number) => {
    if (indexRef.current === next) {
      return;
    }

    indexRef.current = next;
    setReelsPlayerOpen(false);
    setIndex(next);
  }, []);

  const onIndexChange = useCallback(
    (next: number) => {
      if (
        Date.now() < suppressStaleUntilRef.current &&
        next !== targetRef.current
      ) {
        return;
      }

      targetRef.current = next;
      commitIndex(next);
    },
    [commitIndex],
  );

  const jumpTo = useCallback(
    (key: AppTabRouteKey) => {
      const next = ROUTES.findIndex((route) => route.key === key);
      if (next < 0 || next === indexRef.current) {
        return;
      }

      targetRef.current = next;
      suppressStaleUntilRef.current = Date.now() + TAB_PRESS_LOCK_MS;
      commitIndex(next);
      // * Native page + highlight move in this press, before the scene re-render.
      pagerJumpRef.current(key);
    },
    [commitIndex],
  );

  const bindPager = useCallback((bind: PagerBind) => {
    pagerJumpRef.current = bind.jumpTo;
    setPagerPosition((current) =>
      current === bind.position ? current : bind.position,
    );
  }, []);

  const requestReelCompose = useCallback(() => {
    setReelComposeNonce((value) => value + 1);
  }, []);

  const tabsValue = useMemo(
    () => ({
      index,
      jumpTo,
      activeKey: ROUTES[index]?.key ?? 'homepage',
      reelsPlayerOpen,
      setReelsPlayerOpen,
      reelComposeNonce,
      requestReelCompose,
    }),
    [index, jumpTo, reelComposeNonce, reelsPlayerOpen, requestReelCompose],
  );

  const bottomChrome =
    FAB_LIFT + TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, vs(8));
  const isReelsTab = ROUTES[index]?.key === 'reels';
  const immersiveReels = isReelsTab && reelsPlayerOpen;

  useLayoutEffect(() => {
    navigation.setOptions({
      contentStyle: {
        backgroundColor: immersiveReels ? '#000000' : theme.colors.background,
      },
      statusBarStyle: immersiveReels || theme.mode === 'dark' ? 'light' : 'dark',
      statusBarBackgroundColor: 'transparent',
      statusBarTranslucent: true,
    });
  }, [immersiveReels, navigation, theme.colors.background, theme.mode]);

  return (
    <AppTabsProvider value={tabsValue}>
      <ImmersiveStatusBar lightIcons={immersiveReels || theme.mode === 'dark'} />
      <View
        style={[
          styles.root,
          { backgroundColor: immersiveReels ? '#000000' : theme.colors.background },
        ]}>
        <View
          style={[
            styles.pagerWrap,
            { paddingBottom: immersiveReels ? 0 : bottomChrome - FAB_SIZE / 2 },
          ]}>
          <TabView
            animationEnabled={false}
            initialLayout={{ width: layout.width, height: layout.height }}
            navigationState={{ index, routes: ROUTES }}
            onIndexChange={onIndexChange}
            renderScene={renderScene}
            renderTabBar={({ jumpTo: pagerJumpTo, position }) => (
              <TabPagerBridge
                jumpTo={pagerJumpTo}
                onBind={bindPager}
                position={position}
              />
            )}
            style={styles.tabView}
            swipeEnabled
          />
        </View>

        {immersiveReels ? null : (
          <View pointerEvents="box-none" style={styles.tabBarOverlay}>
            <CustomFloatingTabBar
              hideTopEdge={false}
              jumpTo={(key) => jumpTo(key as AppTabRouteKey)}
              navigationState={{ index, routes: ROUTES }}
              position={pagerPosition}
            />
          </View>
        )}
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
    // * No elevation here. Android treats an elevated parent as a full hit target,
    //   which steals presses meant for the screen behind the transparent lift zone.
  },
});
