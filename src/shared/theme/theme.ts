/**
 * Composed design tokens for light / dark themes.
 */

import { colors } from '@/shared/constants/colors';
import { elevation, radius, spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export type AppTheme = {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    primaryMuted: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    danger: string;
    success: string;
    warning: string;
    info: string;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  elevation: typeof elevation;
  typography: typeof typography;
  palette: typeof colors;
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    primary: colors.primary.DEFAULT,
    primaryMuted: colors.primary[100],
    background: colors.semantic.background,
    surface: colors.semantic.surface,
    border: colors.semantic.border,
    text: colors.semantic.textPrimary,
    textSecondary: colors.semantic.textSecondary,
    textMuted: colors.semantic.textMuted,
    danger: colors.danger.DEFAULT,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    info: colors.info.DEFAULT,
  },
  spacing,
  radius,
  elevation,
  typography,
  palette: colors,
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    primary: colors.primary[400],
    primaryMuted: colors.primary[900],
    background: colors.neutral[950],
    surface: colors.neutral[900],
    border: colors.neutral[800],
    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textMuted: colors.neutral[400],
    danger: colors.danger[400],
    success: colors.success[400],
    warning: colors.warning[400],
    info: colors.info[400],
  },
  spacing,
  radius,
  elevation,
  typography,
  palette: colors,
};
