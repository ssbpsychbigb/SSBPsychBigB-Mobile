/**
 * Custom BIGB toast card — brand-aligned, responsive layout.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import type { ToastConfigParams } from 'react-native-toast-message';
import Toast from 'react-native-toast-message';

import { colors } from '@/shared/constants/colors';
import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';

export type AppToastType = 'success' | 'error' | 'info' | 'warning';

type Tone = {
  iconBg: string;
  icon: string;
  border: string;
  Icon: typeof CircleCheck;
};

const TONES: Record<AppToastType, Tone> = {
  success: {
    iconBg: colors.success[50],
    icon: colors.success.DEFAULT,
    border: colors.success[200],
    Icon: CircleCheck,
  },
  error: {
    iconBg: colors.danger[50],
    icon: colors.danger.DEFAULT,
    border: colors.danger[200],
    Icon: CircleAlert,
  },
  info: {
    iconBg: colors.info[50],
    icon: colors.info.DEFAULT,
    border: colors.info[200],
    Icon: Info,
  },
  warning: {
    iconBg: colors.warning[50],
    icon: colors.warning.DEFAULT,
    border: colors.warning[200],
    Icon: TriangleAlert,
  },
};

/**
 * Shared toast visual used by all toast types.
 */
export function AppToastCard({
  type,
  text1,
  text2,
  onPress,
}: ToastConfigParams<Record<string, never>> & { type: AppToastType }) {
  const tone = TONES[type];
  const Icon = tone.Icon;

  return (
    <Pressable
      accessibilityRole="alert"
      onPress={onPress}
      style={[
        styles.card,
        {
          borderColor: tone.border,
          backgroundColor: colors.semantic.surface,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.iconBg }]}>
        <Icon color={tone.icon} size={ms(18)} strokeWidth={2.2} />
      </View>

      <View style={styles.copy}>
        {text1 ? (
          <Text
            maxFontSizeMultiplier={1.35}
            style={[styles.title, { fontFamily: resolveFontFamily('semibold') }]}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text
            maxFontSizeMultiplier={1.35}
            style={[
              styles.message,
              { fontFamily: resolveFontFamily('regular') },
            ]}>
            {text2}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        hitSlop={ms(8)}
        onPress={() => Toast.hide()}
        style={styles.dismiss}>
        <X color={colors.neutral[400]} size={ms(16)} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '92%',
    maxWidth: s(360),
    minHeight: vs(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    borderRadius: ms(14),
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: ms(12),
    shadowOffset: { width: 0, height: vs(6) },
    elevation: 4,
  },
  iconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: vs(2),
  },
  title: {
    fontSize: fontSize(14),
    lineHeight: lineHeight(14, 1.35),
    color: colors.semantic.textPrimary,
  },
  message: {
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.4),
    color: colors.semantic.textSecondary,
  },
  dismiss: {
    padding: ms(4),
  },
});
