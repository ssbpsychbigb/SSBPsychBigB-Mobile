/**
 * Learning paths + daily mission.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { coursePathApi } from '@/features/learn/api/course-path.api';

export const pathKeys = {
  list: ['courses', 'paths'] as const,
  detail: (slug: string) => ['courses', 'paths', slug] as const,
  mission: ['courses', 'daily-mission'] as const,
};

export function useLearningPathsQuery() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: pathKeys.list,
    queryFn: () => coursePathApi.listPaths(undefined, token),
    staleTime: 30_000,
  });
}

export function useLearningPathQuery(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: pathKeys.detail(slug),
    enabled: Boolean(slug),
    queryFn: () => coursePathApi.getPath(slug, token),
    staleTime: 20_000,
  });
}

export function useDailyMissionQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: pathKeys.mission,
    enabled: enabled && Boolean(token),
    queryFn: () => coursePathApi.dailyMission(token as string),
    staleTime: 15_000,
  });
}

export function useClaimDailyMissionMutation() {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Sign in to claim');
      }
      return coursePathApi.claimMission(token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: pathKeys.mission });
    },
  });
}
