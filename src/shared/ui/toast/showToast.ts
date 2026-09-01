/**
 * App-wide imperative toast API.
 * Prefer these helpers over calling Toast.show directly.
 */

import Toast from 'react-native-toast-message';

import type { AppToastType } from '@/shared/ui/toast/AppToastCard';

export type ShowToastOptions = {
  title: string;
  message?: string;
  /** Visibility duration in ms (default 2800). */
  durationMs?: number;
  position?: 'top' | 'bottom';
};

function show(type: AppToastType, options: ShowToastOptions): void {
  const { title, message, durationMs = 2800, position = 'top' } = options;

  // * Do not pass topOffset here — AppToastHost owns safe-area positioning.
  Toast.show({
    type,
    text1: title,
    text2: message,
    position,
    visibilityTime: durationMs,
    autoHide: true,
  });
}

export const showToast = {
  success: (
    title: string,
    message?: string,
    extras?: Omit<ShowToastOptions, 'title' | 'message'>,
  ) => show('success', { title, message, ...extras }),
  error: (
    title: string,
    message?: string,
    extras?: Omit<ShowToastOptions, 'title' | 'message'>,
  ) => show('error', { title, message, ...extras }),
  info: (
    title: string,
    message?: string,
    extras?: Omit<ShowToastOptions, 'title' | 'message'>,
  ) => show('info', { title, message, ...extras }),
  warning: (
    title: string,
    message?: string,
    extras?: Omit<ShowToastOptions, 'title' | 'message'>,
  ) => show('warning', { title, message, ...extras }),
  hide: () => Toast.hide(),
} as const;

/**
 * Convenience: show an error toast from an unknown catch value.
 */
export function showErrorToast(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
  title = 'Error',
): void {
  const message =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : fallback;
  showToast.error(title, message);
}
