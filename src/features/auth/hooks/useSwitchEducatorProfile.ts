/**
 * Switch educator active profile (institute ↔ freelancer brand).
 */

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api/auth.api';
import { authSessionKeys } from '@/features/auth/hooks/useAuthSessionReady';
import {
  getFreelancerProfileId,
  isEducatorInInstituteContext,
} from '@/features/auth/lib/auth-routing';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/shared/api/types';
import { showErrorToast, showToast } from '@/shared/ui/toast';

/**
 * Profile switch helpers for freelancer educators in institute context.
 */
export function useSwitchEducatorProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  const freelancerProfileId = getFreelancerProfileId(user);
  const canSwitchToFreelancer = isEducatorInInstituteContext(user);

  const switchMutation = useMutation({
    mutationFn: (profileId: string) => {
      if (!accessToken) {
        throw new Error('Missing app token');
      }
      return authApi.switchProfile(accessToken, profileId);
    },
    onSuccess: async (session) => {
      setSession(session);
      await queryClient.invalidateQueries({
        queryKey: authSessionKeys.me(accessToken),
      });
    },
  });

  const switchToFreelancer = useCallback(async () => {
    if (!freelancerProfileId) {
      showToast.warning(
        'No freelancer profile',
        'Your personal brand profile is not available.',
      );
      return;
    }

    try {
      await switchMutation.mutateAsync(freelancerProfileId);
      showToast.success(
        'Switched to Freelancer',
        'You are back on your personal brand.',
      );
    } catch (error) {
      showErrorToast(
        error,
        error instanceof ApiError
          ? error.message
          : 'Could not switch to freelancer.',
        'Switch failed',
      );
    }
  }, [freelancerProfileId, switchMutation]);

  const switchToInstitute = useCallback(
    async (instituteProfileId: string, instituteName?: string) => {
      try {
        await switchMutation.mutateAsync(instituteProfileId);
        showToast.success(
          'Entered institute',
          instituteName
            ? `You are now in ${instituteName}.`
            : 'You are now in institute mode.',
        );
      } catch (error) {
        showErrorToast(
          error,
          error instanceof ApiError
            ? error.message
            : 'Could not enter institute.',
          'Enter failed',
        );
      }
    },
    [switchMutation],
  );

  return {
    canSwitchToFreelancer,
    freelancerProfileId,
    isSwitching: switchMutation.isPending,
    switchToFreelancer,
    switchToInstitute,
  };
}
