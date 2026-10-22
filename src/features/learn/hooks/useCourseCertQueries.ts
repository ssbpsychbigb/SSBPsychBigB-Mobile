/**
 * Assignments + certificates.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  courseCertApi,
  type AssignmentFilePart,
} from '@/features/learn/api/course-cert.api';

export const certKeys = {
  assignments: (slug: string) => ['courses', 'assignments', slug] as const,
  eligibility: (slug: string) => ['courses', 'cert-elig', slug] as const,
  mine: (session: string) => ['courses', 'certificates', session] as const,
  verify: (code: string) => ['certificates', 'verify', code] as const,
};

export function useCourseAssignmentsQuery(slug: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: certKeys.assignments(slug),
    enabled: enabled && Boolean(token) && Boolean(slug),
    queryFn: () => courseCertApi.listAssignments(slug, token as string),
    staleTime: 15_000,
  });
}

export function useCertificateEligibilityQuery(slug: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: certKeys.eligibility(slug),
    enabled: enabled && Boolean(token) && Boolean(slug),
    queryFn: () => courseCertApi.eligibility(slug, token as string),
    staleTime: 15_000,
  });
}

export function useSubmitAssignmentMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      assignmentId: string;
      bodyText?: string;
      answers?: number[];
      file?: AssignmentFilePart;
    }) => {
      if (!token) {
        throw new Error('Sign in to submit');
      }
      return courseCertApi.submit(input.assignmentId, input, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: certKeys.assignments(slug) });
      void client.invalidateQueries({ queryKey: certKeys.eligibility(slug) });
    },
  });
}

export function useIssueCertificateMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';
  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Sign in to claim a certificate');
      }
      return courseCertApi.issue(slug, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: certKeys.eligibility(slug) });
      void client.invalidateQueries({ queryKey: certKeys.mine(session) });
    },
  });
}

export function useMyCertificatesQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: certKeys.mine(token || 'guest'),
    enabled: enabled && Boolean(token),
    queryFn: () => courseCertApi.mine(token as string),
    staleTime: 20_000,
  });
}

export function useVerifyCertificateQuery(code: string) {
  return useQuery({
    queryKey: certKeys.verify(code),
    enabled: Boolean(code),
    queryFn: () => courseCertApi.verify(code),
    retry: false,
  });
}
