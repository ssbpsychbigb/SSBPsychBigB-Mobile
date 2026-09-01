/**
 * After persist hydrate, refresh /auth/me so accountStatus stays current.
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { authApi } from '@/features/auth/api/auth.api';
import { useAuthHydrated } from '@/features/auth/hooks/useAuthHydrated';
import { isAppAccountBlocked } from '@/features/auth/lib/auth-routing';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/shared/api/types';

export const authSessionKeys = {
  me: (token: string | null) => ['auth', 'session', 'me', token] as const,
};

/**
 * True when MMKV has rehydrated and (if logged in) /auth/me has settled.
 * Updates the Zustand user from the server so approve/reject is visible on relaunch.
 */
export function useAuthSessionReady(): boolean {
  const hydrated = useAuthHydrated();
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);

  const meQuery = useQuery({
    queryKey: authSessionKeys.me(accessToken),
    enabled: hydrated && Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Missing access token');
      }

      const latest = await authApi.me(accessToken);
      // * Write before React Query marks success so status gates see fresh data.
      useAuthStore.getState().setUser(latest);

      if (isAppAccountBlocked(latest)) {
        useAuthStore.getState().clearSession();
      }

      return latest;
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!meQuery.error) {
      return;
    }

    const unauthorized =
      meQuery.error instanceof ApiError &&
      (meQuery.error.status === 401 || meQuery.error.status === 403);

    if (unauthorized) {
      clearSession();
    }
  }, [meQuery.error, clearSession]);

  if (!hydrated) {
    return false;
  }

  if (!accessToken) {
    return true;
  }

  return meQuery.isSuccess || meQuery.isError;
}
