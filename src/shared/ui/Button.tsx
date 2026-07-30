/**
 * Primary interactive button with loading / disabled states.
 * Heights use moderate scale (ms) — not verticalScale — so CTAs stay compact on tall phones.
 */

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ms, s } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText } from '@/shared/ui/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

/** Modern compact CTA heights (iOS HIG–friendly touch targets). */
export const BUTTON_HEIGHT = {
  sm: ms(40),
  md: ms(44),
  lg: ms(48),
} as const;

/**
 * Themed pressable button used across features.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.colors.danger,
    },
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: {
      height: BUTTON_HEIGHT.sm,
      paddingHorizontal: s(14),
      borderRadius: ms(10),
    },
    md: {
      height: BUTTON_HEIGHT.md,
      paddingHorizontal: s(16),
      borderRadius: ms(12),
    },
    lg: {
      height: BUTTON_HEIGHT.lg,
      paddingHorizontal: s(18),
      borderRadius: ms(12),
    },
  };

  const labelColor =
    variant === 'secondary' || variant === 'ghost' ? 'primary' : 'inverse';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => {
        const composed: StyleProp<ViewStyle> = [
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? styles.fullWidth : null,
          pressed && !isDisabled ? styles.pressed : null,
          isDisabled ? styles.disabled : null,
          typeof style === 'function' ? style({ pressed }) : style,
        ];

        return composed;
      }}
      {...rest}>
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'secondary' || variant === 'ghost'
              ? theme.colors.primary
              : '#FFFFFF'
          }
        />
      ) : typeof children === 'string' ? (
        <AppText variant="label" color={labelColor}>
          {children}
        </AppText>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: ms(8),
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
});
