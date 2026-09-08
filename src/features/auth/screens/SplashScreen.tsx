/**
 * Minimal premium launch splash for BIGB auth flow.
 */

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';
import {
  SplashBrand,
  SPLASH_DURATION_MS,
} from '@/features/auth/components/SplashBrand';
import { markAuthSplashComplete } from '@/features/auth/lib/auth-entry';
import { ImmersiveStatusBar, Screen } from '@/shared/ui';

type SplashScreenProps = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

/**
 * Shows a short brand motion intro and routes to Welcome.
 */
export function SplashScreen({ navigation }: SplashScreenProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      markAuthSplashComplete();
      navigation.replace('Welcome');
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
