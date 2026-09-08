/**
 * Cold-launch splash that lands on the public Feed shell.
 */

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/app/navigation/types';
import {
  SplashBrand,
  SPLASH_DURATION_MS,
} from '@/features/auth/components/SplashBrand';
import { markAuthSplashComplete } from '@/features/auth/lib/auth-entry';
import { ImmersiveStatusBar, Screen } from '@/shared/ui';

type AppLaunchSplashProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/**
 * Brand intro for guests, then replace with the public app tabs.
 */
export function AppLaunchSplash({ navigation }: AppLaunchSplashProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      markAuthSplashComplete();
      navigation.replace('App');
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <Screen padded={false} style={styles.screen}>
      <ImmersiveStatusBar />
      <SplashBrand />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
