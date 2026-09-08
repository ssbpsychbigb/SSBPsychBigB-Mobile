/**
 * Soft auth gate — guest write actions land here before Login / Register.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { LogIn, Sparkles } from 'lucide-react-native';

import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { BUTTON_HEIGHT } from '@/shared/ui/Button';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type JoinToContinueSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

/**
 * Bottom-aligned join sheet used across Feed and gated tabs.
 */
export function JoinToContinueSheet({
  visible,
  title,
  message,
  onClose,
}: JoinToContinueSheetProps) {
  const theme = useTheme();
  const openLogin = useOpenAuth('Login');
  const openRegister = useOpenAuth('Register');

  const handleLogin = () => {
    onClose();
    openLogin();
  };

  const handleJoin = () => {
    onClose();
    openRegister();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
            <Sparkles color={theme.colors.primary} size={ms(24)} strokeWidth={2} />
          </View>

          <AppText style={styles.title} variant="subtitle" weight="bold">
            {title}
          </AppText>
          <AppText color="secondary" style={styles.message} variant="caption">
            {message}
          </AppText>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleJoin}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: theme.colors.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <AppText color="inverse" variant="label">
                Join BIGB
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.btn,
                styles.btnGhost,
                {
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}>
              <LogIn color={theme.colors.text} size={ms(16)} strokeWidth={2} />
              <AppText variant="label">Log in</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13, 30, 52, 0.42)',
    paddingHorizontal: s(16),
    paddingBottom: vs(28),
  },
  card: {
    borderWidth: 1,
    borderRadius: ms(24),
    paddingHorizontal: s(22),
    paddingTop: vs(22),
    paddingBottom: vs(18),
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
  },
  message: {
    textAlign: 'center',
    marginTop: vs(8),
    marginBottom: vs(20),
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.45),
  },
  actions: {
    alignSelf: 'stretch',
    gap: ms(10),
  },
  btn: {
    height: BUTTON_HEIGHT.md,
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: ms(8),
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
});
