/**
 * Root toast host — mount once near the app root (above screens).
 */

import { Platform, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ms, vs } from '@/shared/lib/responsive';
import { toastConfig } from '@/shared/ui/toast/toastConfig';

/**
 * Renders the global toast portal. Keep as the last sibling under providers.
 */
export function AppToastHost() {
  const insets = useSafeAreaInsets();

  const statusBarFallback =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 44;
  const topInset = insets.top > 0 ? insets.top : statusBarFallback;

  return (
    <Toast
      bottomOffset={Math.max(insets.bottom, vs(12)) + vs(72)}
      config={toastConfig}
      position="top"
      topOffset={topInset + ms(6)}
      visibilityTime={2800}
    />
  );
}
