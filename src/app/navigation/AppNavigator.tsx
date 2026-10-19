/**
 * Authenticated app shell — native tabs so switching does not remount screens.
 */

import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppTabsProvider } from '@/app/navigation/AppTabsContext';
import { CustomFloatingTabBar } from '@/app/navigation/CustomFloatingTabBar';
import type {
  AppTabParamList,
  AppTabRouteKey,
  RootStackParamList,
} from '@/app/navigation/types';
import { CommunitiesScreen } from '@/features/community';
import { FeedScreen } from '@/features/feed';
import { LearnScreen } from '@/features/learn';
import { ProfileScreen } from '@/features/profile';
import { ReelsScreen } from '@/features/reels';
import { useTheme } from '@/shared/theme';
import { ImmersiveStatusBar } from '@/shared/ui';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_TITLES: Record<AppTabRouteKey, string> = {
  homepage: 'Feed',
  reels: 'Reels',
  myCourse: 'My Course',
  communities: 'Community',
  profile: 'You',
};

/**
 * Signed-in experience with overlay floating tab bar.
 * Inactive tabs stay mounted and frozen so taps feel instant.
 */
export function AppNavigator() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'App'>>();
  const [reelsPlayerOpen, setReelsPlayerOpen] = useState(false);
  const [reelComposeNonce, setReelComposeNonce] = useState(0);

  const jumpTo = useCallback(
    (key: AppTabRouteKey) => {
      navigation.navigate('App', { screen: key });
    },
    [navigation],
  );

  const requestReelCompose = useCallback(() => {
    setReelComposeNonce((value) => value + 1);
    navigation.navigate('App', { screen: 'reels' });
  }, [navigation]);

  const immersiveReels = reelsPlayerOpen;

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
    <AppTabsProvider
      activeKey="homepage"
      jumpTo={jumpTo}
      reelComposeNonce={reelComposeNonce}
      reelsPlayerOpen={reelsPlayerOpen}
      requestReelCompose={requestReelCompose}
      setReelsPlayerOpen={setReelsPlayerOpen}>
      <ImmersiveStatusBar lightIcons={immersiveReels || theme.mode === 'dark'} />
      <View
        style={[
          styles.root,
          { backgroundColor: immersiveReels ? '#000000' : theme.colors.background },
        ]}>
        <Tab.Navigator
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            freezeOnBlur: true,
            animation: 'none',
            lazy: true,
            sceneStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
          tabBar={(props) =>
            immersiveReels ? null : (
              <CustomFloatingTabBar
                jumpTo={(key) => {
                  const name = key as AppTabRouteKey;
                  const index = props.state.routes.findIndex(
                    (route) => route.name === name,
                  );
                  if (index === props.state.index) {
                    return;
                  }
                  props.navigation.navigate(name);
                }}
                navigationState={{
                  index: props.state.index,
                  routes: props.state.routes.map((route) => ({
                    key: route.name as AppTabRouteKey,
                    title: TAB_TITLES[route.name as AppTabRouteKey],
                  })),
                }}
              />
            )
          }>
          <Tab.Screen component={FeedScreen} name="homepage" />
          <Tab.Screen
            component={ReelsScreen}
            name="reels"
            options={{
              sceneStyle: {
                backgroundColor: immersiveReels ? '#000000' : theme.colors.background,
              },
            }}
          />
          <Tab.Screen component={LearnScreen} name="myCourse" />
          <Tab.Screen component={CommunitiesScreen} name="communities" />
          <Tab.Screen component={ProfileScreen} name="profile" />
        </Tab.Navigator>
      </View>
    </AppTabsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
