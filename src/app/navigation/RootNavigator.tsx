/**
 * Root navigator — Auth / status locks / onboarding / App.
 */

import { useMemo, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';

import { AppNavigator } from '@/app/navigation/AppNavigator';
import { AuthNavigator } from '@/app/navigation/AuthNavigator';
import { PermissionGate } from '@/app/providers/PermissionGate';
import type { RootStackParamList } from '@/app/navigation/types';
import {
  ApplicationRejectedScreen,
  ApplicationResubmitScreen,
  OnboardingScreen,
  RestrictedAccessScreen,
  UnderReviewScreen,
  useAuthSessionReady,
  useAuthStore,
} from '@/features/auth';
import { getPostAuthDestination } from '@/features/auth/lib/auth-routing';
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

/**
 * Top-level navigation gate with /auth/me refresh and status routing.
 */
export function RootNavigator() {
  const theme = useTheme();
  const sessionReady = useAuthSessionReady();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [onboardingTick, setOnboardingTick] = useState(0);

  const destination = useMemo(() => {
    void onboardingTick;
    if (!accessToken) {
      return 'auth' as const;
    }

    return getPostAuthDestination(user);
  }, [accessToken, user, onboardingTick]);

  const navigationTheme = {
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
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {destination === 'auth' ? (
            <Stack.Screen component={AuthNavigator} name="Auth" />
          ) : null}

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

          {destination === 'app' ? (
            <Stack.Screen component={AppNavigator} name="App" />
          ) : null}
        </Stack.Navigator>
      </NavigationContainer>
      <PermissionGate />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
