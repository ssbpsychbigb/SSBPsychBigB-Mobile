/**
 * Root toast host — mount once near the app root (above screens).
 */

import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { vs } from '@/shared/lib/responsive';
import { useScreenTopPadding } from '@/shared/lib/safe-area';
import { toastConfig } from '@/shared/ui/toast/toastConfig';

/**
 * Renders the global toast portal. Keep as the last sibling under providers.
 */
export function AppToastHost() {
  const insets = useSafeAreaInsets();
  const topOffset = useScreenTopPadding(vs(4));

  return (
    <Toast
      bottomOffset={Math.max(insets.bottom, vs(12)) + vs(72)}
      config={toastConfig}
      position="top"
      topOffset={topOffset}
      visibilityTime={2800}
    />
  );
}
