/**
 * Premium themed permission modal (pre-prompt before OS dialog).
 */

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image as ImageIcon, ShieldCheck } from 'lucide-react-native';

import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type PermissionModalProps = {
  visible: boolean;
  isLoading?: boolean;
  onAllow: () => void;
  onNotNow: () => void;
};

/**
 * Explains why BIGB needs photo access before the system prompt.
 */
export function PermissionModal({
  visible,
  isLoading = false,
  onAllow,
  onNotNow,
}: PermissionModalProps) {
  const theme = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onNotNow}
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: theme.colors.primaryMuted },
            ]}>
            <ShieldCheck
              color={theme.colors.primary}
              size={ms(28)}
              strokeWidth={1.8}
            />
          </View>

          <AppText style={styles.title} variant="subtitle" weight="bold">
            Allow photo access
          </AppText>
          <AppText color="secondary" style={styles.body} variant="caption">
            BIGB uses photos for profile images and verification documents during
            registration. You stay in control of what you upload.
          </AppText>

          <View style={styles.points}>
            <View style={styles.pointRow}>
              <ImageIcon
                color={theme.colors.primary}
                size={ms(16)}
                strokeWidth={2}
              />
              <AppText color="secondary" style={styles.pointText} variant="caption">
                Upload profile and ID documents securely
              </AppText>
            </View>
            <View style={styles.pointRow}>
              <ShieldCheck
                color={theme.colors.primary}
                size={ms(16)}
                strokeWidth={2}
              />
              <AppText color="secondary" style={styles.pointText} variant="caption">
                Used only for account verification needs
              </AppText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            onPress={onAllow}
            style={({ pressed }) => [
              styles.primaryBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: isLoading ? 0.6 : pressed ? 0.9 : 1,
              },
            ]}>
            <AppText color="inverse" variant="label" weight="semibold">
              {isLoading ? 'Please wait…' : 'Allow access'}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            hitSlop={ms(8)}
            onPress={onNotNow}
            style={styles.secondaryBtn}>
            <AppText color="secondary" variant="caption" weight="semibold">
              Not now
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    width: '100%',
    maxWidth: s(360),
    borderRadius: ms(20),
    borderWidth: 1,
    paddingHorizontal: s(22),
    paddingTop: vs(24),
    paddingBottom: vs(18),
    alignItems: 'center',
  },
  iconWrap: {
    width: ms(58),
    height: ms(58),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  title: {
    textAlign: 'center',
    fontSize: fontSize(20),
    lineHeight: lineHeight(20, 1.3),
  },
  body: {
    marginTop: vs(8),
    textAlign: 'center',
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.45),
  },
  points: {
    width: '100%',
    marginTop: vs(18),
    marginBottom: vs(20),
    gap: ms(10),
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
  },
  pointText: {
    flex: 1,
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.4),
  },
  primaryBtn: {
    width: '100%',
    height: ms(48),
    borderRadius: ms(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    marginTop: vs(14),
    paddingVertical: vs(6),
  },
});
