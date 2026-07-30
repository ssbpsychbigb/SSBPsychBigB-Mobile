/**
 * Reusable confirmation dialog — compact, brand-aligned, responsive.
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { LogOut, type LucideIcon } from 'lucide-react-native';

import { BUTTON_HEIGHT } from '@/shared/ui/Button';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type ConfirmModalTone = 'default' | 'danger';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmModalTone;
  Icon?: LucideIcon;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Centered confirm sheet used for destructive / important actions.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  Icon = LogOut,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const theme = useTheme();
  const isDanger = tone === 'danger';
  const accent = isDanger ? theme.colors.danger : theme.colors.primary;
  const accentMuted = isDanger
    ? theme.palette.danger[50]
    : theme.colors.primaryMuted;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
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
          <View style={[styles.iconWrap, { backgroundColor: accentMuted }]}>
            <Icon color={accent} size={ms(24)} strokeWidth={2} />
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
              disabled={isLoading}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <AppText
                numberOfLines={2}
                style={styles.btnLabel}
                variant="label"
                weight="semibold">
                {cancelLabel}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: accent,
                  opacity: isLoading ? 0.55 : pressed ? 0.9 : 1,
                },
              ]}>
              <AppText
                color="inverse"
                numberOfLines={2}
                style={styles.btnLabel}
                variant="label"
                weight="semibold">
                {isLoading ? 'Please wait…' : confirmLabel}
              </AppText>
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
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    width: '100%',
    maxWidth: s(360),
    borderRadius: ms(18),
    borderWidth: 1,
    paddingHorizontal: s(20),
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
    maxWidth: s(280),
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: s(10),
    marginTop: vs(20),
  },
  btn: {
    flex: 1,
    minHeight: BUTTON_HEIGHT.md,
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(8),
    paddingVertical: vs(10),
  },
  btnLabel: {
    textAlign: 'center',
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.25),
  },
  cancelBtn: {
    borderWidth: 1,
  },
});
