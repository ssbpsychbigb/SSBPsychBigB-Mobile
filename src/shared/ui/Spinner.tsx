/**
 * App-wide loading state — renders the BIGB brand loader.
 */

import type { StyleProp, ViewStyle } from 'react-native';

import { BrandLoader } from '@/shared/ui/BrandLoader';

export type SpinnerProps = {
  size?: 'small' | 'large';
  /** Fills the parent and centers the loader. */
  fullScreen?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Spinner({ size = 'large', fullScreen = false, label, style }: SpinnerProps) {
  return <BrandLoader fill={fullScreen} label={label} size={size} style={style} />;
}
