/**
 * Login screen — mobile OTP entry via Zustand auth store.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AuthStackParamList } from '@/app/navigation/types';
import {
  AuthField,
  AuthMobileInput,
} from '@/features/auth/components/AuthFields';
import {
  isValidIndianMobile,
  normalizeMobileNumber,
} from '@/features/auth/lib/format-mobile';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { APP_CONFIG } from '@/shared/constants/config';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Screen } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

/**
 * Default auth entry: login only.
 */
export function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useTheme();
  const sendLoginOtp = useAuthStore((state) => state.sendLoginOtp);
  const isSendingOtp = useAuthStore((state) => state.isSendingOtp);
  const authError = useAuthStore((state) => state.authError);
  const clearAuthError = useAuthStore((state) => state.clearAuthError);

  const [mobileNumber, setMobileNumber] = useState('');
  const [focused, setFocused] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();

  const error = localError || authError || undefined;
  const canSubmit = isValidIndianMobile(mobileNumber) && !isSendingOtp;

  const handleContinue = async () => {
    const normalized = normalizeMobileNumber(mobileNumber);

    if (!isValidIndianMobile(normalized)) {
      setLocalError('Enter a valid 10-digit Indian mobile number.');
      showToast.warning(
        'Invalid mobile',
        'Enter a valid 10-digit Indian mobile number.',
      );
      return;
    }

    setLocalError(undefined);
    clearAuthError();

    try {
      const result = await sendLoginOtp(normalized);
      showToast.success(
        'OTP sent',
        result.emailSent
          ? 'Check your email for the verification code.'
          : 'Enter the code to continue.',
      );
      navigation.navigate('Otp', {
        mobileNumber: normalized,
        purpose: 'login',
        debugOtp: result.debugOtp,
      });
    } catch (error) {
      // * authError is already set in the store.
      showErrorToast(error, 'Could not send OTP. Please try again.', 'Login failed');
    }
  };

  return (
    <Screen padded={false} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          <AppText color="brand" style={styles.brand} variant="title" weight="bold">
            {APP_CONFIG.appName}
          </AppText>

          <View style={styles.body}>
            <AppText style={styles.headline} variant="title" weight="bold">
              Sign in
            </AppText>
            <AppText color="secondary" style={styles.support} variant="caption">
              Enter your mobile number to continue. Invited institute staff should
              use the number from their invite.
            </AppText>

            <AuthField label="Mobile number">
              <AuthMobileInput
                focused={focused}
                onBlur={() => setFocused(false)}
                onChangeText={(value) => {
                  setMobileNumber(value);
                  setLocalError(undefined);
                  clearAuthError();
                }}
                onFocus={() => setFocused(true)}
                value={mobileNumber}
              />
            </AuthField>

            {error ? (
              <AppText color="danger" style={styles.error} variant="caption">
                {error}
              </AppText>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => {
                handleContinue().catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: !canSubmit ? 0.4 : pressed ? 0.88 : 1,
                },
              ]}>
              {isSendingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText color="inverse" variant="label" weight="semibold">
                  Continue
                </AppText>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="link"
              hitSlop={ms(8)}
              onPress={() => navigation.navigate('Register')}
              style={styles.registerLink}>
              <AppText color="secondary" variant="caption">
                {"Don't have an account? "}
                <AppText color="brand" variant="caption" weight="semibold">
                  Register
                </AppText>
              </AppText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: s(24),
    paddingTop: vs(16),
    paddingBottom: vs(28),
  },
  brand: {
    letterSpacing: 1.2,
    fontSize: fontSize(20),
    lineHeight: lineHeight(20, 1.3),
  },
  body: {
    flex: 1,
    marginTop: vs(36),
  },
  headline: {
    fontSize: fontSize(22),
    lineHeight: lineHeight(28, 1.21),
    letterSpacing: -0.3,
  },
  support: {
    marginTop: vs(6),
    marginBottom: vs(28),
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.43),
  },
  error: {
    marginTop: vs(10),
  },
  footer: {
    gap: ms(16),
    paddingTop: vs(12),
  },
  cta: {
    height: ms(48),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerLink: {
    alignItems: 'center',
  },
});
