/**
 * Spacing, radius, and elevation tokens — screen-scaled.
 */

import { ms, s, vs } from '@/shared/lib/responsive';

export const spacing = {
  none: 0,
  xxs: ms(2),
  xs: ms(4),
  sm: ms(8),
  md: ms(12),
  lg: ms(16),
  xl: ms(20),
  '2xl': ms(24),
  '3xl': ms(32),
  '4xl': ms(40),
  '5xl': ms(48),
  '6xl': ms(64),
} as const;

export const radius = {
  none: 0,
  sm: ms(4),
  md: ms(8),
  lg: ms(12),
  xl: ms(16),
  '2xl': ms(24),
  full: 9999,
} as const;

export const elevation = {
  none: 0,
  sm: ms(2),
  md: ms(4),
  lg: ms(8),
  xl: ms(12),
} as const;

/** Raw (unscaled) spacing for rare cases that must stay fixed. */
export const spacingRaw = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Elevation = typeof elevation;

export { s, vs, ms };
