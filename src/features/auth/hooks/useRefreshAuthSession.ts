/**
 * Manually refresh /auth/me so status-lock screens can update without re-login.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api/auth.api';
import { authSessionKeys } from '@/features/auth/hooks/useAuthSessionReady';
import { isAppAccountBlocked } from '@/features/auth/lib/auth-routing';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/shared/api/types';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type RefreshAuthSessionResult = {
  refreshing: boolean;
  refreshSession: () => Promise<void>;
};

/**
 * Refetches the signed-in user and writes it into the auth store.
 */
export function useRefreshAuthSession(): RefreshAuthSessionResult {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [refreshing, setRefreshing] = useState(false);

  const refreshSession = useCallback(async () => {
    if (!accessToken || refreshing) {
      return;
    }

    setRefreshing(true);
    try {
      const latest = await authApi.me(accessToken);
      useAuthStore.getState().setUser(latest);

      if (isAppAccountBlocked(latest)) {
        clearSession();
        showToast.error(
          'Account unavailable',
          'This account can no longer sign in.',
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: authSessionKeys.me(accessToken),
      });

      const status = latest.accountStatus;
      if (status === 'active') {
        showToast.success('Status updated', 'Your account is now active.');
      } else if (status === 'rejected') {
        showToast.info(
          'Status updated',
          'Your application needs corrections.',
        );
      } else if (status === 'restricted') {
        showToast.warning(
          'Status updated',
          'Your account is currently restricted.',
        );
      } else {
        showToast.info(
          'Still under review',
          'No status change yet. Pull again anytime.',
        );
      }
    } catch (error) {
      const unauthorized =
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403);

      if (unauthorized) {
        clearSession();
        showToast.error('Session expired', 'Please sign in again.');
        return;
      }

      showErrorToast(error, 'Could not refresh status. Try again.', 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [accessToken, clearSession, queryClient, refreshing]);

  return { refreshing, refreshSession };
}
