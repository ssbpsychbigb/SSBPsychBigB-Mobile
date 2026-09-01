/**
 * In-app email verification sheet — OTP plus resend (link is in the same email).
 */

import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Mail } from 'lucide-react-native';

import { OtpInput } from '@/features/auth/components/OtpInput';
import { EMAIL_VERIFY_OTP_LENGTH } from '@/features/auth/constants/email-verification';
import type { UseEmailVerificationResult } from '@/features/auth/hooks/useEmailVerification';
import { maskEmail } from '@/features/auth/lib/mask-email';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button } from '@/shared/ui';

export type EmailVerificationSheetProps = {
  visible: boolean;
  email: string;
  verification: UseEmailVerificationResult;
  onClose: () => void;
};

/**
 * Opens the Mail app when possible so the user can copy the code or tap the link.
 */
function openMailApp(): void {
  const url = Platform.OS === 'ios' ? 'message://' : 'mailto:';
  void Linking.openURL(url).catch(() => undefined);
}

/**
 * Centered sheet for confirming inbox ownership without leaving BIGB.
 */
export function EmailVerificationSheet({
  visible,
  email,
  verification,
  onClose,
}: EmailVerificationSheetProps) {
  const theme = useTheme();
  const {
    otp,
    cooldown,
    isSending,
    isVerifying,
    canEnterOtp,
    canResend,
    error,
    sendError,
    debugOtp,
    handleOtpChange,
    sendVerification,
    verifyOtp,
  } = verification;

  const maskedEmail = maskEmail(email);
  const message = isSending
    ? `Sending a verification link and code to ${maskedEmail}…`
    : canEnterOtp
      ? `We sent a link and a ${EMAIL_VERIFY_OTP_LENGTH}-digit code to ${maskedEmail}.`
      : sendError
        ? `We could not send the email to ${maskedEmail}.`
        : `Preparing your verification email for ${maskedEmail}…`;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        onPress={() => {
          if (!isSending) {
            onClose();
          }
        }}
        style={styles.backdrop}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.palette.warning[100] },
            ]}
          >
            <Mail color={theme.colors.warning} size={ms(24)} strokeWidth={2} />
          </View>

          <AppText style={styles.title} variant="subtitle" weight="bold">
            Verify your email
          </AppText>
          <AppText color="secondary" style={styles.message} variant="caption">
            {message}
          </AppText>

          {isSending ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <AppText color="secondary" style={styles.loadingText} variant="caption">
                Sending verification email…
              </AppText>
            </View>
          ) : !canEnterOtp ? (
            <View style={styles.loadingWrap}>
              {sendError ? (
                <AppText color="danger" style={styles.error} variant="caption">
                  {sendError}
                </AppText>
              ) : null}
              <AppText color="secondary" style={styles.loadingText} variant="caption">
                Tap Try again to resend, or close and come back later.
              </AppText>
            </View>
          ) : (
            <>
              <View style={styles.otpWrap}>
                <OtpInput
                  disabled={isVerifying}
                  hasError={Boolean(error)}
                  onChange={handleOtpChange}
                  onComplete={(code) => {
                    void verifyOtp(code);
                  }}
                  value={otp}
                />
              </View>

              {error ? (
                <AppText color="danger" style={styles.error} variant="caption">
                  {error}
                </AppText>
              ) : null}

              {debugOtp ? (
                <AppText color="muted" style={styles.debug} variant="caption">
                  Dev code: {debugOtp}
                </AppText>
              ) : null}

              {verification.lastSend?.debugVerifyUrl ? (
                <Pressable
                  onPress={() => {
                    void Linking.openURL(
                      verification.lastSend?.debugVerifyUrl || '',
                    );
                  }}
                  style={styles.mailLink}
                >
                  <AppText color="brand" variant="caption" weight="semibold">
                    Open verify link (dev)
                  </AppText>
                </Pressable>
              ) : null}

              <Pressable
                disabled={!canResend}
                onPress={() => {
                  void sendVerification();
                }}
                style={styles.resend}
              >
                <AppText color="secondary" variant="caption" weight="semibold">
                  {canResend
                    ? 'Resend email'
                    : `Resend available in ${cooldown}s`}
                </AppText>
              </Pressable>

              <Pressable onPress={openMailApp} style={styles.mailLink}>
                <AppText color="secondary" variant="caption">
                  Open Mail app
                </AppText>
              </Pressable>
            </>
          )}

          <View style={styles.actions}>
            <View style={[styles.actionBtn, isSending && styles.actionBtnFull]}>
              <Button fullWidth onPress={onClose} size="md" variant="secondary">
                Later
              </Button>
            </View>
            {!isSending ? (
              <View style={styles.actionBtn}>
                {!canEnterOtp ? (
                  <Button
                    fullWidth
                    onPress={() => {
                      void sendVerification();
                    }}
                    size="md"
                  >
                    Try again
                  </Button>
                ) : (
                  <Button
                    disabled={otp.length !== EMAIL_VERIFY_OTP_LENGTH}
                    fullWidth
                    loading={isVerifying}
                    onPress={() => {
                      void verifyOtp();
                    }}
                    size="md"
                  >
                    Confirm
                  </Button>
                )}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(20),
  },
  card: {
    width: '100%',
    maxWidth: s(400),
    borderRadius: ms(18),
    borderWidth: 1,
    paddingHorizontal: s(18),
    paddingTop: vs(22),
    paddingBottom: vs(16),
    alignItems: 'center',
  },
  iconWrap: {
    width: ms(52),
    height: ms(52),
    borderRadius: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(14),
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize(18),
    lineHeight: lineHeight(18, 1.3),
  },
  message: {
    marginTop: vs(8),
    textAlign: 'center',
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.45),
  },
  loadingWrap: {
    width: '100%',
    minHeight: vs(120),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(18),
    gap: vs(10),
  },
  loadingText: {
    textAlign: 'center',
    paddingHorizontal: s(8),
  },
  otpWrap: {
    width: '100%',
    marginTop: vs(18),
  },
  error: {
    marginTop: vs(10),
    textAlign: 'center',
  },
  debug: {
    marginTop: vs(8),
    textAlign: 'center',
  },
  resend: {
    marginTop: vs(14),
    paddingVertical: vs(4),
  },
  mailLink: {
    paddingVertical: vs(4),
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: s(10),
    marginTop: vs(16),
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnFull: {
    flexGrow: 1,
  },
});
