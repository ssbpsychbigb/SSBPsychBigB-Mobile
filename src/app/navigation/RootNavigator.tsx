/**
 * Root navigator — public Feed shell, auth modal, status locks, onboarding.
 */

import { useEffect, useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';

import { AppLaunchSplash } from '@/app/navigation/AppLaunchSplash';
import { AppNavigator } from '@/app/navigation/AppNavigator';
import { AuthNavigator } from '@/app/navigation/AuthNavigator';
import { PermissionGate } from '@/app/providers/PermissionGate';
import type { RootStackParamList } from '@/app/navigation/types';
import {
  ApplicationRejectedScreen,
  ApplicationResubmitScreen,
  EmailVerificationHost,
  OnboardingScreen,
  RestrictedAccessScreen,
  UnderReviewScreen,
  useAuthSessionReady,
  useAuthStore,
} from '@/features/auth';
import { getPostAuthDestination } from '@/features/auth/lib/auth-routing';
import { shouldShowLaunchSplash } from '@/features/auth/lib/auth-entry';
import { HomeScreen } from '@/features/home';
import { BookmarkScreen } from '@/features/bookmark';
import { MessageScreen } from '@/features/message';
import { NetworkScreen } from '@/features/network';
import { NotificationsScreen } from '@/features/notifications';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { useTheme } from '@/shared/theme';
import { Spinner } from '@/shared/ui';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RejectedProps = NativeStackScreenProps<
  RootStackParamList,
  'ApplicationRejected'
>;

type ResubmitProps = NativeStackScreenProps<
  RootStackParamList,
  'ApplicationResubmit'
>;

function ApplicationRejectedRoute({ navigation }: RejectedProps) {
  return (
    <ApplicationRejectedScreen
      onResubmit={() => navigation.navigate('ApplicationResubmit')}
    />
  );
}

function ApplicationResubmitRoute({ navigation }: ResubmitProps) {
  return (
    <ApplicationResubmitScreen
      onBack={() => navigation.goBack()}
      onResubmitted={() => {
        // * accountStatus → pending_verification remounts UnderReview via destination.
      }}
    />
  );
}

function ModalAuthNavigator() {
  return <AuthNavigator mode="modal" />;
}

function GateAuthNavigator() {
  return <AuthNavigator mode="full" />;
}

/**
 * Top-level navigation gate with /auth/me refresh and status routing.
 */
export function RootNavigator() {
  const theme = useTheme();
  const sessionReady = useAuthSessionReady();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [onboardingTick, setOnboardingTick] = useState(0);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  const destination = useMemo(() => {
    void onboardingTick;
    if (!accessToken) {
      return 'app' as const;
    }

    return getPostAuthDestination(user);
  }, [accessToken, user, onboardingTick]);

  const appInitialRoute =
    !accessToken && shouldShowLaunchSplash() ? 'Splash' : 'App';

  useEffect(() => {
    if (!sessionReady || !navigationRef.isReady()) {
      return;
    }
    if (destination !== 'app' || !accessToken) {
      return;
    }
    const rootState = navigationRef.getRootState();
    const focusedRoot = rootState?.routes[rootState.index]?.name;
    if (focusedRoot === 'Auth') {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'App' }],
      });
    }
  }, [accessToken, destination, navigationRef, sessionReady]);

  const resolvedNavTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  if (!sessionReady) {
    return <Spinner fullScreen />;
  }

  return (
    <View style={styles.root}>
      <EmailVerificationHost />
      <View style={styles.navigator}>
        <NavigationContainer ref={navigationRef} theme={resolvedNavTheme}>
        <Stack.Navigator
          initialRouteName={
            destination === 'app' ? appInitialRoute : undefined
          }
          screenOptions={{
            headerShown: false,
            statusBarTranslucent: true,
            statusBarBackgroundColor: 'transparent',
            statusBarStyle: theme.mode === 'dark' ? 'light' : 'dark',
          }}>
          {destination === 'underReview' ? (
            <Stack.Screen component={UnderReviewScreen} name="UnderReview" />
          ) : null}

          {destination === 'applicationRejected' ? (
            <>
              <Stack.Screen
                component={ApplicationRejectedRoute}
                name="ApplicationRejected"
              />
              <Stack.Screen
                component={ApplicationResubmitRoute}
                name="ApplicationResubmit"
              />
            </>
          ) : null}

          {destination === 'restricted' ? (
            <Stack.Screen
              component={RestrictedAccessScreen}
              name="Restricted"
            />
          ) : null}

          {destination === 'onboarding' ? (
            <Stack.Screen name="Onboarding">
              {() => (
                <OnboardingScreen
                  onComplete={() => setOnboardingTick((value) => value + 1)}
                />
              )}
            </Stack.Screen>
          ) : null}

          {destination === 'auth' ? (
            <Stack.Screen component={GateAuthNavigator} name="Auth" />
          ) : null}

          {destination === 'app' ? (
            <>
              <Stack.Screen component={AppLaunchSplash} name="Splash" />
              <Stack.Screen component={AppNavigator} name="App" />
              <Stack.Screen component={BookmarkScreen} name="Bookmarks" />
              <Stack.Screen component={NetworkScreen} name="Network" />
              <Stack.Screen component={MessageScreen} name="Messages" />
              <Stack.Screen
                component={NotificationsScreen}
                name="Notifications"
              />
              <Stack.Screen
                component={HomeScreen}
                name="Workspace"
                options={{
                  headerShown: true,
                  title: 'Workspace',
                  headerBackTitle: 'Feed',
                  headerShadowVisible: false,
                  headerTintColor: theme.colors.text,
                  headerStyle: { backgroundColor: theme.colors.background },
                  headerTitleStyle: {
                    fontFamily: resolveFontFamily('semibold'),
                    color: theme.colors.text,
                  },
                }}
              />
              <Stack.Screen
                component={ModalAuthNavigator}
                name="Auth"
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                }}
              />
            </>
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
      </View>
      <PermissionGate />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navigator: {
    flex: 1,
  },
});
