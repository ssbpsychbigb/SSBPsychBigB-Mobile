/**
 * OTP verification screen — login / register purpose (web parity).
 */

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';

import type { AuthStackParamList } from '@/app/navigation/types';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { useOtpVerification } from '@/features/auth/hooks/useOtpVerification';
import { maskMobileNumber } from '@/features/auth/lib/format-mobile';
import { APP_CONFIG } from '@/shared/constants/config';
import { FEATURE_FLAGS } from '@/shared/constants';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';

export type OtpScreenProps = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

/**
 * Premium OTP entry with resend cooldown and change-number escape.
 */
export function OtpScreen({ navigation, route }: OtpScreenProps) {
  const theme = useTheme();
  const { mobileNumber, purpose, joinType, debugOtp } = route.params;

  const {
    otp,
    errors,
    isVerifying,
    isResending,
    cooldown,
    canResend,
    isAttemptsExhausted,
    focusRequestId,
    debugOtpHint,
    handleOtpChange,
    verifyOtp,
    resendOtp,
  } = useOtpVerification({
    mobileNumber,
    purpose,
    initialDebugOtp: debugOtp,
  });

  const shownDebugOtp =
    FEATURE_FLAGS.exposeOtpInDev && (debugOtpHint || debugOtp);

  const headline =
    purpose === 'register' ? 'Verify your mobile' : 'Enter verification code';

  const subtitle = (() => {
    if (purpose !== 'register') {
      return 'We sent a 6-digit code to sign you in securely.';
    }
    if (joinType === 'institute') {
      return 'Verify your mobile. After this, your institute stays under review until BIGB Admin approves.';
    }
    if (joinType === 'defence_officer') {
      return 'Verify your mobile. After this, your officer application stays under review until approval.';
    }
    if (joinType === 'educator') {
      return 'Verify your mobile. After this, your educator application stays under review until BIGB Admin approves.';
    }
    return 'We sent a 6-digit code to confirm your new BIGB account.';
  })();

  return (
    <Screen padded={false} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={ms(10)}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ArrowLeft
            color={theme.colors.text}
            size={ms(20)}
            strokeWidth={1.9}
          />
        </Pressable>
        <AppText color="brand" style={styles.brand} variant="title" weight="bold">
          {APP_CONFIG.appName}
        </AppText>
      </View>

      <View style={styles.content}>
        <AppText style={styles.headline} variant="title" weight="bold">
          {headline}
        </AppText>
        <AppText color="secondary" style={styles.support} variant="caption">
          {subtitle}
        </AppText>

        <View
          style={[
            styles.sentCard,
            {
              backgroundColor: theme.colors.primaryMuted,
              borderColor: theme.colors.border,
            },
          ]}>
          <AppText color="muted" style={styles.sentLabel} variant="caption">
            Code sent to
          </AppText>
          <AppText style={styles.sentNumber} variant="label" weight="semibold">
            {maskMobileNumber(mobileNumber)}
          </AppText>
          <Pressable hitSlop={ms(8)} onPress={() => navigation.goBack()}>
            <AppText color="brand" style={styles.changeNumber} variant="caption" weight="semibold">
              Change number
            </AppText>
          </Pressable>
        </View>

        {shownDebugOtp && !isAttemptsExhausted ? (
          <View
            style={[
              styles.debugBox,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}>
            <AppText color="secondary" style={styles.debugText} variant="caption">
              Your OTP:{' '}
              <AppText color="brand" variant="caption" weight="bold">
                {shownDebugOtp}
              </AppText>
            </AppText>
            <AppText color="muted" style={styles.debugHint} variant="caption">
              SMS delivery is not connected yet — use this code to continue.
            </AppText>
          </View>
        ) : null}

        {isAttemptsExhausted ? (
          <View
            style={[
              styles.exhaustedBox,
              {
                borderColor: theme.colors.danger,
                backgroundColor: theme.colors.surface,
              },
            ]}>
            <AppText style={styles.exhaustedTitle} variant="label" weight="semibold">
              Too many incorrect attempts
            </AppText>
            <AppText color="secondary" style={styles.exhaustedBody} variant="caption">
              This code is locked for security. Request a new OTP to continue, or
              change your number and try again.
            </AppText>
            <Pressable
              disabled={isResending}
              onPress={() => {
                resendOtp().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: isResending ? 0.6 : pressed ? 0.88 : 1,
                },
              ]}>
              {isResending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText color="inverse" variant="label" weight="semibold">
                  Send new OTP
                </AppText>
              )}
            </Pressable>
            <Pressable hitSlop={ms(8)} onPress={() => navigation.goBack()}>
              <AppText color="brand" style={styles.changeNumber} variant="caption" weight="semibold">
                Change number
              </AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <AppText color="secondary" style={styles.otpLabel} variant="caption" weight="medium">
              Enter OTP
            </AppText>
            <OtpInput
              disabled={isVerifying}
              focusRequestId={focusRequestId}
              hasError={Boolean(errors.otp)}
              onChange={handleOtpChange}
              onComplete={(code) => {
                verifyOtp(code).catch(() => undefined);
              }}
              value={otp}
            />
            {errors.otp ? (
              <AppText color="danger" style={styles.errorText} variant="caption">
                {errors.otp}
              </AppText>
            ) : (
              <AppText color="muted" style={styles.helperText} variant="caption">
                Enter the 6-digit code, or paste it in one go
              </AppText>
            )}

            {errors.submit ? (
              <View
                style={[
                  styles.submitError,
                  { backgroundColor: theme.colors.surface },
                ]}>
                <AppText color="danger" variant="caption" weight="medium">
                  {errors.submit}
                </AppText>
              </View>
            ) : null}

            <Pressable
              disabled={otp.length < 6 || isVerifying}
              onPress={() => {
                verifyOtp().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: otp.length < 6 || isVerifying ? 0.4 : pressed ? 0.88 : 1,
                },
              ]}>
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText color="inverse" variant="label" weight="semibold">
                  Verify & Continue
                </AppText>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <AppText color="secondary" variant="caption">
                Didn&apos;t receive the code?{' '}
              </AppText>
              <Pressable
                disabled={!canResend}
                hitSlop={ms(6)}
                onPress={() => {
                  resendOtp().catch(() => undefined);
                }}>
                <AppText
                  color={canResend ? 'brand' : 'muted'}
                  variant="caption"
                  weight="semibold">
                  {isResending
                    ? 'Sending…'
                    : canResend
                      ? 'Resend OTP'
                      : `Resend in ${cooldown}s`}
                </AppText>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    paddingBottom: vs(4),
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    letterSpacing: 1.1,
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 24 / 18),
  },
  content: {
    flex: 1,
    paddingHorizontal: s(24),
    paddingTop: vs(12),
    paddingBottom: vs(28),
  },
  headline: {
    fontSize: fontSize(22),
    lineHeight: lineHeight(26, 32 / 26),
    letterSpacing: -0.2,
  },
  support: {
    marginTop: vs(6),
    marginBottom: vs(20),
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 18 / 13),
  },
  sentCard: {
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    alignItems: 'center',
    marginBottom: vs(18),
  },
  sentLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: fontSize(11),
  },
  sentNumber: {
    marginTop: vs(4),
    fontSize: fontSize(15),
  },
  changeNumber: {
    marginTop: vs(8),
  },
  debugBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: ms(12),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    marginBottom: vs(16),
    alignItems: 'center',
  },
  debugText: {
    textAlign: 'center',
  },
  debugHint: {
    marginTop: vs(4),
    textAlign: 'center',
    fontSize: fontSize(11),
  },
  exhaustedBox: {
    borderWidth: 1,
    borderRadius: ms(14),
    padding: ms(16),
    gap: ms(12),
    alignItems: 'center',
  },
  exhaustedTitle: {
    textAlign: 'center',
  },
  exhaustedBody: {
    textAlign: 'center',
    lineHeight: lineHeight(13, 18 / 13),
  },
  form: {
    gap: ms(12),
  },
  otpLabel: {
    textAlign: 'center',
    marginBottom: vs(2),
  },
  errorText: {
    textAlign: 'center',
  },
  helperText: {
    textAlign: 'center',
  },
  submitError: {
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  cta: {
    height: ms(48),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(8),
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: vs(8),
  },
});
