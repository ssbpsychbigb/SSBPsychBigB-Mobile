/**
 * Waits for Zustand persist hydration before routing decisions.
 */

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Returns true once the auth store has rehydrated from MMKV.
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    () => useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useAuthStore.persist.hasHydrated());

    return unsub;
  }, []);

  return hydrated;
}
