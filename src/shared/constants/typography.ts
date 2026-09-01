/**
 * Typography tokens — Sora (bundled under src/assets/fonts).
 * Sizes stay close to native product UI (not oversized marketing type).
 */

import { fontFamilies, resolveFontFamily } from '@/shared/constants/fonts';
import type { FontFamilyKey } from '@/shared/constants/fonts';
import { fontSize } from '@/shared/lib/responsive';

export const typography = {
  fontFamily: {
    /** Default / body face. */
    sans: fontFamilies.regular,
    headline: fontFamilies.bold,
    body: fontFamilies.regular,
    label: fontFamilies.semibold,
    ...fontFamilies,
  },
  /**
   * Semantic weight → linked face.
   * Use resolveFontFamily / these keys; avoid RN fontWeight with custom TTFs.
   */
  weight: {
    thin: 'thin',
    extraLight: 'extraLight',
    light: 'light',
    regular: 'regular',
    medium: 'medium',
    semibold: 'semibold',
    bold: 'bold',
    extraBold: 'extraBold',
  } as const satisfies Record<FontFamilyKey, FontFamilyKey>,
  fontSize: {
    xs: fontSize(11),
    sm: fontSize(12),
    base: fontSize(15),
    lg: fontSize(17),
    xl: fontSize(20),
    '2xl': fontSize(22),
    '3xl': fontSize(28),
    '4xl': fontSize(32),
    '5xl': fontSize(36),
  },
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.45,
    relaxed: 1.55,
    loose: 1.7,
  },
  resolve: resolveFontFamily,
} as const;

export type Typography = typeof typography;
