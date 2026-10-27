/**
 * App-wide pull-to-refresh — one brand-coloured indicator that stays up until every refetch settles.
 */

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { RefreshControl, type RefreshControlProps } from 'react-native';

import { useTheme } from '@/shared/theme';

/** Keeps a fast refetch from blinking the indicator in and out. */
const MIN_VISIBLE_MS = 600;

export type PullToRefreshOptions = {
  /** Extra busy flag owned by the caller (e.g. a manual "Refresh" button). */
  refreshing?: boolean;
  progressViewOffset?: number;
};

/**
 * Returns a ready `RefreshControl` for `refreshControl={...}`.
 * `refreshing` flips true synchronously on pull — query `isRefetching` lags a frame,
 * which makes Android drop the spinner and flash an empty circle.
 */
export function usePullToRefresh(
  onRefresh: () => unknown,
  options: PullToRefreshOptions = {},
): ReactElement<RefreshControlProps> {
  const theme = useTheme();
  const [pulling, setPulling] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  const mounted = useRef(true);
  const busy = useRef(false);

  onRefreshRef.current = onRefresh;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setPulling(true);
    const startedAt = Date.now();
    try {
      await onRefreshRef.current();
    } catch {
      // Callers surface their own errors (toasts / error states).
    } finally {
      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, remaining);
        });
      }
      busy.current = false;
      if (mounted.current) {
        setPulling(false);
      }
    }
  }, []);

  return (
    <RefreshControl
      colors={[theme.colors.primary]}
      onRefresh={() => void handleRefresh()}
      progressBackgroundColor={theme.mode === 'dark' ? theme.colors.surface : '#FFFFFF'}
      progressViewOffset={options.progressViewOffset}
      refreshing={pulling || Boolean(options.refreshing)}
      tintColor={theme.colors.primary}
    />
  );
}
