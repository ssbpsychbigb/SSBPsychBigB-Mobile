/**
 * Shared modern auth field primitives for Login / Register.
 */

import type { ReactNode } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { resolveFontFamily } from '@/shared/constants/fonts';
import { fontSize, lineHeight, ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui';

export type AuthFieldProps = {
  label: string;
  children: ReactNode;
};

/**
 * Compact label + control stack.
 */
export function AuthField({ label, children }: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <AppText color="secondary" style={styles.label} variant="caption" weight="medium">
        {label}
      </AppText>
      {children}
    </View>
  );
}

export type AuthTextInputProps = Omit<TextInputProps, 'style'> & {
  focused?: boolean;
};

/**
 * Soft filled text input — compact premium sizing.
 */
export function AuthTextInput({ focused = false, ...rest }: AuthTextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      maxFontSizeMultiplier={1.35}
      placeholderTextColor={theme.colors.textMuted}
      style={[
        styles.input,
        {
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          fontFamily: resolveFontFamily('regular'),
        },
      ]}
      {...rest}
    />
  );
}

export type AuthMobileInputProps = {
  value: string;
  focused?: boolean;
  onChangeText: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * Mobile input with +91 prefix inside one soft field.
 */
export function AuthMobileInput({
  value,
  focused = false,
  onChangeText,
  onFocus,
  onBlur,
}: AuthMobileInputProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.mobileShell,
        {
          backgroundColor: theme.colors.surface,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
        },
      ]}>
      <AppText color="secondary" style={styles.prefix} variant="caption" weight="semibold">
        +91
      </AppText>
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
      <TextInput
        keyboardType={'number-pad' as KeyboardTypeOptions}
        maxFontSizeMultiplier={1.35}
        maxLength={10}
        onBlur={onBlur}
        onChangeText={(next) => onChangeText(next.replace(/\D/g, ''))}
        onFocus={onFocus}
        placeholder="10-digit number"
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.mobileInput,
          {
            color: theme.colors.text,
            fontFamily: resolveFontFamily('regular'),
          },
        ]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: ms(8),
  },
  label: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.25),
    letterSpacing: 0.1,
  },
  input: {
    height: ms(48),
    borderWidth: 1,
    borderRadius: ms(12),
    paddingHorizontal: s(14),
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.35),
  },
  mobileShell: {
    height: ms(48),
    borderWidth: 1,
    borderRadius: ms(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
  },
  prefix: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.25),
    minWidth: s(28),
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: vs(18),
    marginHorizontal: s(10),
  },
  mobileInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.35),
  },
});
