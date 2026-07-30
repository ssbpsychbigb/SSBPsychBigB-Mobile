/**
 * Style composition helper for React Native style arrays / objects.
 */

import type { StyleProp } from 'react-native';

/**
 * Filters falsy style entries for StyleSheet composition.
 */
export function cn<T>(
  ...styles: Array<StyleProp<T> | false | null | undefined>
): StyleProp<T> {
  return styles.filter(Boolean) as StyleProp<T>;
}
