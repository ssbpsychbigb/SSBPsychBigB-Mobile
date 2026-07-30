/**
 * Toast visual config for react-native-toast-message.
 */

import type { ToastConfig } from 'react-native-toast-message';

import { AppToastCard } from '@/shared/ui/toast/AppToastCard';

export const toastConfig: ToastConfig = {
  success: (props) => <AppToastCard {...props} type="success" />,
  error: (props) => <AppToastCard {...props} type="error" />,
  info: (props) => <AppToastCard {...props} type="info" />,
  warning: (props) => <AppToastCard {...props} type="warning" />,
};
