/**
 * Root logout confirmation modal — mounted once in AppProviders.
 */

import { LogOut } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';

import { authSessionKeys } from '@/features/auth/hooks/useAuthSessionReady';
import { useLogoutConfirmStore } from '@/features/auth/store/logout-confirm.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { showToast } from '@/shared/ui/toast';

/**
 * Confirms sign-out before clearing the session.
 */
export function LogoutConfirmGate() {
  const visible = useLogoutConfirmStore((state) => state.visible);
  const cancelLogout = useLogoutConfirmStore((state) => state.cancelLogout);
  const clearSession = useAuthStore((state) => state.clearSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const handleConfirm = () => {
    cancelLogout();
    clearSession();
    queryClient.removeQueries({ queryKey: authSessionKeys.me(accessToken) });
    queryClient.removeQueries({ queryKey: ['auth', 'session', 'me'] });
    showToast.info('Signed out', 'See you soon on BIGB.');
  };

  return (
    <ConfirmModal
      Icon={LogOut}
      cancelLabel="Stay signed in"
      confirmLabel="Sign out"
      message="You’ll need to verify your mobile OTP again to get back into BIGB."
      onCancel={cancelLogout}
      onConfirm={handleConfirm}
      title="Sign out of BIGB?"
      tone="danger"
      visible={visible}
    />
  );
}
