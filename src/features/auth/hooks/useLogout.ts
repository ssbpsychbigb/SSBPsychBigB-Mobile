/**
 * Shared logout — opens confirmation modal (parity with careful mobile UX).
 */

import { useCallback } from 'react';

import { useLogoutConfirmStore } from '@/features/auth/store/logout-confirm.store';

/**
 * Returns a stable handler that prompts for logout confirmation.
 */
export function useLogout(): () => void {
  const promptLogout = useLogoutConfirmStore((state) => state.promptLogout);

  return useCallback(() => {
    promptLogout();
  }, [promptLogout]);
}
