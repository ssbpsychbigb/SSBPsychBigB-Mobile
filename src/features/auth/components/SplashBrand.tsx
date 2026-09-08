/**
 * Shared launch mark used by auth splash and guest app splash.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ms, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { BrandLogo } from '@/shared/ui';

export const SPLASH_DURATION_MS = 1900;

/**
 * Official lockup + loading dots for the cold-launch splash.
 */
export function SplashBrand() {
  const theme = useTheme();

  return (
    <View style={styles.center}>
      <Animated.View entering={FadeInDown.duration(560)} style={styles.logo}>
        <BrandLogo align="center" size="splash" />
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(220).duration(650)} style={styles.loadingRow}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primaryMuted }]} />
        <View style={[styles.dot, styles.dotMid, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: theme.colors.primaryMuted }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },
  logo: {
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(28),
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
