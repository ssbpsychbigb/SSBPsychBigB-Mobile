/**
 * Theme-aware text primitive with Sora typography roles.
 * Scale follows mobile product norms (iOS HIG / Material-like), not marketing posters.
 */

import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { resolveFontFamily } from '@/shared/constants/fonts';
import type { FontFamilyKey } from '@/shared/constants/fonts';
import { fontSize, lineHeight } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';

export type AppTextVariant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'label';

export type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'danger' | 'inverse' | 'brand';
  /** Override the face derived from the variant. */
  weight?: FontFamilyKey;
};

const VARIANT_WEIGHT: Record<AppTextVariant, FontFamilyKey> = {
  display: 'bold',
  title: 'bold',
  subtitle: 'semibold',
  body: 'regular',
  caption: 'regular',
  label: 'semibold',
};

/**
 * Typography-aware Text wrapper (Sora faces, no synthetic fontWeight).
 */
export function AppText({
  variant = 'body',
  color = 'primary',
  weight,
  style,
  maxFontSizeMultiplier = 1.3,
  ...rest
}: AppTextProps) {
  const theme = useTheme();

  const colorMap: Record<NonNullable<AppTextProps['color']>, string> = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    danger: theme.colors.danger,
    inverse: '#FFFFFF',
    brand: theme.colors.primary,
  };

  const composed: TextStyle = {
    ...styles[variant],
    color: colorMap[color],
    fontFamily: resolveFontFamily(weight ?? VARIANT_WEIGHT[variant]),
  };

  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[composed, style]}
      {...rest}
    />
  );
}

/**
 * Compact product type scale (design @ 375pt width).
 * display ≈ Large Title, title ≈ Title 2, subtitle ≈ Title 3 / Headline.
 */
const styles = StyleSheet.create({
  display: {
    fontSize: fontSize(28),
    lineHeight: lineHeight(28, 1.2),
  },
  title: {
    fontSize: fontSize(20),
    lineHeight: lineHeight(20, 1.3),
  },
  subtitle: {
    fontSize: fontSize(17),
    lineHeight: lineHeight(17, 1.35),
  },
  body: {
    fontSize: fontSize(15),
    lineHeight: lineHeight(15, 1.45),
  },
  caption: {
    fontSize: fontSize(12),
    lineHeight: lineHeight(12, 1.4),
  },
  label: {
    fontSize: fontSize(13),
    lineHeight: lineHeight(13, 1.35),
  },
});
