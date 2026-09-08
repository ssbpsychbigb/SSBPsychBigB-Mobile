/**
 * Shared in-screen header row. Top inset is owned by Screen / overlay chrome.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { s, vs } from '@/shared/lib/responsive';

export type ScreenHeaderProps = {
  children: ReactNode;
  /** Horizontal inset. Default true. Feed supplies its own pad. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * One header height and vertical rhythm for Feed, stack chrome, and auth bars.
 */
export function ScreenHeader({
  children,
  padded = true,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.row, padded ? styles.padded : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: vs(44),
    paddingBottom: vs(4),
  },
  padded: {
    paddingHorizontal: s(16),
  },
});
