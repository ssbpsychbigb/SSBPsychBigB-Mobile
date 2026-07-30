/**
 * Centered activity indicator for boot / async gates.
 */

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ms } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';

export type SpinnerProps = {
  size?: 'small' | 'large';
  fullScreen?: boolean;
};

/**
 * Theme-colored loading spinner.
 */
export function Spinner({ size = 'large', fullScreen = false }: SpinnerProps) {
  const theme = useTheme();

  return (
    <View style={fullScreen ? styles.fullScreen : styles.inline}>
      <ActivityIndicator color={theme.colors.primary} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ms(16),
  },
});
