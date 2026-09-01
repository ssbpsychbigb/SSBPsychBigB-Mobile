/**
 * Linked custom font face names (file basename without extension).
 * Must match files under src/assets/fonts linked via react-native.config.js.
 */

export const fontFamilies = {
  thin: 'Sora-Thin',
  extraLight: 'Sora-ExtraLight',
  light: 'Sora-Light',
  regular: 'Sora-Regular',
  medium: 'Sora-Medium',
  semibold: 'Sora-SemiBold',
  bold: 'Sora-Bold',
  extraBold: 'Sora-ExtraBold',
} as const;

export type FontFamilyKey = keyof typeof fontFamilies;
export type FontFamilyName = (typeof fontFamilies)[FontFamilyKey];

/**
 * Resolves a CSS-like weight token to a concrete Sora face.
 * Prefer this over RN fontWeight when using per-file TTFs (Android-safe).
 */
export function resolveFontFamily(
  weight: FontFamilyKey | 'normal' = 'regular',
): FontFamilyName {
  if (weight === 'normal') {
    return fontFamilies.regular;
  }

  return fontFamilies[weight];
}
