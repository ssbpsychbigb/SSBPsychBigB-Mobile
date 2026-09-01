/**
 * Minimal premium launch splash for BIGB auth flow.
 */

import { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Shield } from 'lucide-react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { markAuthSplashComplete } from '@/features/auth/lib/auth-entry';
import { APP_CONFIG } from '@/shared/constants/config';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';

type SplashScreenProps = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const SPLASH_DURATION_MS = 1900;

/**
 * Shows a short brand motion intro and routes to Welcome.
 */
export function SplashScreen({ navigation }: SplashScreenProps) {
  const theme = useTheme();
  const ringPulse = useSharedValue(1);
  const logoLift = useSharedValue(0);

  useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    );

    logoLift.value = withRepeat(
      withSequence(
        withTiming(vs(-4), { duration: 1250 }),
        withTiming(0, { duration: 1250 }),
      ),
      -1,
      false,
    );

    const timer = setTimeout(() => {
      markAuthSplashComplete();
      navigation.replace('Welcome');
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [logoLift, navigation, ringPulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
    opacity: 0.75 + (ringPulse.value - 1) * 2.5,
  }));

  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoLift.value }],
  }));

  return (
    <Screen padded={false} style={styles.screen}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      />

      <View style={styles.center}>
        <Animated.View
          entering={FadeInDown.duration(560)}
          style={[
            styles.pulseRing,
            ringStyle,
            { borderColor: theme.colors.primaryMuted },
          ]}
        />
        <Animated.View
          entering={FadeInDown.delay(120).duration(600)}
          layout={LinearTransition}
          style={[
            styles.emblemWrap,
            emblemStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <Shield color={theme.colors.primary} size={ms(36)} strokeWidth={1.9} />
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(150).duration(700)} style={styles.textWrap}>
          <AppText color="brand" style={styles.brand} variant="display">
            {APP_CONFIG.appName}
          </AppText>
          <AppText color="secondary" style={styles.tagline} variant="caption">
            Learn. Connect. Lead.
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(280).duration(650)} style={styles.loadingRow}>
          <View style={[styles.dot, { backgroundColor: theme.colors.primaryMuted }]} />
          <View style={[styles.dot, styles.dotMid, { backgroundColor: theme.colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: theme.colors.primaryMuted }]} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: s(172),
    height: s(172),
    borderRadius: ms(999),
    borderWidth: 1,
  },
  emblemWrap: {
    width: ms(98),
    height: ms(98),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  textWrap: {
    marginTop: vs(24),
    alignItems: 'center',
  },
  brand: {
    letterSpacing: 1.7,
    fontSize: fontSize(34),
    lineHeight: lineHeight(34, 1.12),
  },
  tagline: {
    marginTop: vs(7),
    letterSpacing: 0.3,
    fontSize: fontSize(15),
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(20),
    gap: ms(8),
  },
  dot: {
    width: ms(4),
    height: ms(4),
    borderRadius: ms(999),
  },
  dotMid: {
    width: ms(6),
    height: ms(6),
  },
});
