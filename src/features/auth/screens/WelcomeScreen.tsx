/**
 * Premium guest welcome — brand-first entry into OTP auth.
 */

import { useEffect } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight, Shield } from 'lucide-react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { APP_CONFIG } from '@/shared/constants/config';
import { FEATURE_FLAGS } from '@/shared/constants/feature-flags';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type WelcomeScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Welcome'
>;

/**
 * First composition after splash: brand hero + primary auth CTAs.
 */
export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ringPulse = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);

  useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600 }),
        withTiming(1, { duration: 1600 }),
      ),
      -1,
      false,
    );
    glowOpacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1800 }),
          withTiming(0.28, { duration: 1800 }),
        ),
        -1,
        false,
      ),
    );
  }, [glowOpacity, ringPulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Screen padded={false} style={styles.screen}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* Soft brand atmosphere — not flat white. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            styles.glowTop,
            glowStyle,
            { backgroundColor: theme.palette.primary[100] },
          ]}
        />
        <View
          style={[
            styles.orbLeft,
            { backgroundColor: theme.palette.primary[50] },
          ]}
        />
        <View
          style={[
            styles.orbRight,
            { backgroundColor: theme.palette.primary[100] },
          ]}
        />
        <View
          style={[
            styles.bottomWash,
            { backgroundColor: theme.palette.neutral[50] },
          ]}
        />
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, vs(16)) + vs(12),
            paddingBottom: Math.max(insets.bottom, vs(16)) + vs(20),
          },
        ]}>
        <Animated.View
          entering={FadeInDown.duration(650)}
          style={styles.hero}>
          <View style={styles.emblemStage}>
            <Animated.View
              style={[
                styles.pulseRing,
                ringStyle,
                { borderColor: theme.palette.primary[200] },
              ]}
            />
            <Animated.View
              entering={FadeIn.delay(120).duration(500)}
              style={[
                styles.emblem,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.palette.primary[200],
                  shadowColor: theme.colors.primary,
                },
              ]}>
              <Shield
                color={theme.colors.primary}
                size={ms(40)}
                strokeWidth={1.85}
              />
            </Animated.View>
          </View>

          <AppText color="brand" style={styles.brand} variant="display">
            {APP_CONFIG.appName}
          </AppText>
          <AppText color="secondary" style={styles.tagline} variant="body">
            Elite social infrastructure for SSB aspirants
          </AppText>
          <View style={styles.proofRow}>
            <View
              style={[
                styles.proofDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <AppText color="muted" style={styles.proof} variant="caption">
              Learn · Connect · Lead
            </AppText>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(220).duration(600)}
          style={styles.ctaBlock}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => [
              styles.primaryCta,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.9 : 1,
                shadowColor: theme.colors.primary,
              },
            ]}>
            <AppText
              color="inverse"
              style={styles.primaryLabel}
              variant="label">
              Continue with mobile
            </AppText>
            <ArrowRight color="#FFFFFF" size={ms(18)} strokeWidth={2.25} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Register')}
            style={({ pressed }) => [
              styles.secondaryCta,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}>
            <AppText style={styles.secondaryLabel} variant="label">
              Create account
            </AppText>
          </Pressable>

          {FEATURE_FLAGS.googleSignIn ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                showToast.info(
                  'Coming soon',
                  'Google Sign-In will be available in a later release.',
                )
              }
              style={styles.googleLink}>
              <AppText color="brand" variant="label">
                Continue with Google
              </AppText>
            </Pressable>
          ) : null}

          <AppText color="muted" style={styles.footer} variant="caption">
            Secure OTP login · v{APP_CONFIG.appVersion}
          </AppText>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: vs(-80),
    left: s(-40),
    right: s(-40),
    height: vs(320),
    borderBottomLeftRadius: ms(200),
    borderBottomRightRadius: ms(200),
  },
  orbLeft: {
    position: 'absolute',
    top: vs(120),
    left: s(-60),
    width: s(180),
    height: s(180),
    borderRadius: ms(90),
    opacity: 0.7,
  },
  orbRight: {
    position: 'absolute',
    top: vs(220),
    right: s(-70),
    width: s(200),
    height: s(200),
    borderRadius: ms(100),
    opacity: 0.55,
  },
  bottomWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: vs(280),
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: s(28),
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: vs(24),
  },
  emblemStage: {
    width: s(140),
    height: s(140),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(28),
  },
  pulseRing: {
    position: 'absolute',
    width: s(132),
    height: s(132),
    borderRadius: ms(66),
    borderWidth: 1.5,
  },
  emblem: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: vs(12) },
    shadowOpacity: 0.18,
    shadowRadius: ms(24),
    elevation: ms(8),
  },
  brand: {
    letterSpacing: 3,
    fontSize: fontSize(32),
    lineHeight: lineHeight(32, 1.15),
    fontFamily: resolveFontFamily('extraBold'),
    textAlign: 'center',
  },
  tagline: {
    marginTop: vs(14),
    textAlign: 'center',
    maxWidth: s(300),
    lineHeight: lineHeight(16, 1.5),
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginTop: vs(20),
  },
  proofDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  proof: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontSize: fontSize(11),
  },
  ctaBlock: {
    gap: ms(10),
    paddingTop: vs(8),
  },
  primaryCta: {
    height: ms(48),
    borderRadius: ms(12),
    paddingHorizontal: s(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(8),
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.2,
    shadowRadius: ms(10),
    elevation: 3,
  },
  primaryLabel: {
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.3),
    fontFamily: resolveFontFamily('semibold'),
  },
  secondaryCta: {
    height: ms(48),
    borderRadius: ms(12),
    borderWidth: 1,
    paddingHorizontal: s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.3),
    fontFamily: resolveFontFamily('semibold'),
  },
  googleLink: {
    alignItems: 'center',
    paddingVertical: vs(8),
  },
  footer: {
    textAlign: 'center',
    marginTop: vs(4),
  },
});
