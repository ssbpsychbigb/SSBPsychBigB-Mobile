/**
 * Launch permission gate — shows branded modal after app main screen is ready.
 */

import { useEffect } from 'react';

import { usePermissionsStore } from '@/features/auth/store/permissions.store';
import { PermissionModal } from '@/shared/ui/PermissionModal';
import { showToast } from '@/shared/ui/toast';

/**
 * Mount once near the app root so permission is asked after splash/hydration.
 */
export function PermissionGate() {
  const isVisible = usePermissionsStore(
    (state) => state.isPermissionModalVisible,
  );
  const isRequestingMedia = usePermissionsStore(
    (state) => state.isRequestingMedia,
  );
  const openLaunchPermissionModal = usePermissionsStore(
    (state) => state.openLaunchPermissionModal,
  );
  const acceptPermissionPrompt = usePermissionsStore(
    (state) => state.acceptPermissionPrompt,
  );
  const skipPermissionPrompt = usePermissionsStore(
    (state) => state.skipPermissionPrompt,
  );

  useEffect(() => {
    const reveal = () => {
      const timer = setTimeout(() => {
        openLaunchPermissionModal();
      }, 500);
      return timer;
    };

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (usePermissionsStore.persist.hasHydrated()) {
      timer = reveal();
    }

    const unsub = usePermissionsStore.persist.onFinishHydration(() => {
      timer = reveal();
    });

    return () => {
      unsub();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [openLaunchPermissionModal]);

  return (
    <PermissionModal
      isLoading={isRequestingMedia}
      onAllow={() => {
        acceptPermissionPrompt()
          .then((granted) => {
            if (granted) {
              showToast.success(
                'Access allowed',
                'You can upload photos when needed.',
              );
            } else {
              showToast.warning(
                'Access denied',
                'You can enable photo access later in settings.',
              );
            }
          })
          .catch(() => {
            showToast.error(
              'Permission error',
              'Could not request photo access.',
            );
          });
      }}
      onNotNow={() => {
        skipPermissionPrompt();
        showToast.info('Skipped for now', 'You can allow photo access later.');
      }}
      visible={isVisible}
    />
  );
}
