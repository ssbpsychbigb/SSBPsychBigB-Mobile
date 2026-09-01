/**
 * Compact verify-email reminder above the signed-in navigator.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { MailWarning } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maskEmail } from '@/features/auth/lib/mask-email';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type EmailVerificationBannerProps = {
  email: string;
  onVerify: () => void;
};

/**
 * Non-blocking warning strip — login and the rest of the app stay available.
 */
export function EmailVerificationBanner({
  email,
  onVerify,
}: EmailVerificationBannerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, vs(8)),
          backgroundColor: theme.palette.warning[50],
          borderBottomColor: theme.palette.warning[200],
        },
      ]}
    >
      <View style={styles.row}>
        <MailWarning
          color={theme.palette.warning[700]}
          size={ms(18)}
          strokeWidth={2}
        />
        <View style={styles.copy}>
          <AppText
            style={styles.title}
            variant="caption"
            weight="bold"
          >
            Please verify your email
          </AppText>
          <AppText color="secondary" style={styles.subtitle} variant="caption">
            {maskEmail(email)} · tap to enter the code or open the email link.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onVerify}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: theme.colors.warning,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <AppText style={styles.ctaLabel} variant="label" weight="semibold">
            Verify
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    paddingHorizontal: s(16),
    paddingBottom: vs(10),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.3),
  },
  subtitle: {
    marginTop: vs(2),
    fontSize: fontSize(11),
    lineHeight: lineHeight(11, 1.35),
  },
  cta: {
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  ctaLabel: {
    color: '#1A1A1A',
  },
});
