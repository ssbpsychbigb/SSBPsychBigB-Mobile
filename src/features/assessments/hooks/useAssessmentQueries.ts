/**
 * React Query keys and learner assessment fetches.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { assessmentApi } from '@/features/assessments/api/assessment.api';
import type { AttemptAnswer } from '@/features/assessments/types/assessment.types';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const asmtKeys = {
  all: ['assessments'] as const,
  list: (q: string, session: string) =>
    [...asmtKeys.all, 'list', q, session] as const,
  detail: (slug: string, session: string) =>
    [...asmtKeys.all, 'detail', slug, session] as const,
  attempt: (attemptId: string, session: string) =>
    [...asmtKeys.all, 'attempt', attemptId, session] as const,
};

export function useAssessmentsQuery(q: string, enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  const session = token || 'guest';
  return useQuery({
    queryKey: asmtKeys.list(q, session),
    enabled,
    queryFn: () =>
      assessmentApi.list({
        q: q.trim() || undefined,
        token,
      }),
    staleTime: 20_000,
  });
}

export function useAssessmentDetailQuery(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: asmtKeys.detail(slug, token || 'guest'),
    enabled: Boolean(slug),
    queryFn: () => assessmentApi.get(slug, token),
    staleTime: 20_000,
  });
}

export function useAttemptQuery(attemptId: string, enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: asmtKeys.attempt(attemptId, token || 'guest'),
    enabled: enabled && Boolean(token && attemptId),
    queryFn: () => assessmentApi.getAttempt(attemptId, token as string),
    staleTime: 5_000,
  });
}

export function useStartAssessmentMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (idOrSlug: string) => {
      if (!token) {
        throw new Error('Sign in to start');
      }
      return assessmentApi.start(idOrSlug, token);
    },
    onSuccess: (attempt, idOrSlug) => {
      client.setQueryData(asmtKeys.attempt(attempt.id, session), attempt);
      void client.invalidateQueries({
        queryKey: asmtKeys.detail(idOrSlug, session),
      });
    },
  });
}

export function useSubmitAttemptMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: { attemptId: string; answers: AttemptAnswer[] }) => {
      if (!token) {
        throw new Error('Sign in to submit');
      }
      return assessmentApi.submit(input.attemptId, input.answers, token);
    },
    onSuccess: (attempt) => {
      client.setQueryData(asmtKeys.attempt(attempt.id, session), attempt);
      void client.invalidateQueries({ queryKey: asmtKeys.all });
    },
  });
}

export function useBookmarkItemMutation(attemptId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: { itemId: string; folder: string }) => {
      if (!token) throw new Error('Sign in to save a question');
      return assessmentApi.bookmark(
        input.itemId,
        { folder: input.folder, attemptId },
        token,
      );
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: asmtKeys.attempt(attemptId, session),
      });
      void client.invalidateQueries({
        queryKey: [...asmtKeys.all, 'bookmarks'],
      });
    },
  });
}

export function useUnbookmarkItemMutation(attemptId: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (itemId: string) => {
      if (!token) throw new Error('Sign in to update a bookmark');
      return assessmentApi.unbookmark(itemId, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: asmtKeys.attempt(attemptId, session),
      });
      void client.invalidateQueries({
        queryKey: [...asmtKeys.all, 'bookmarks'],
      });
    },
  });
}

export function useChallengeItemMutation(attemptId: string) {
  const token = useAuthStore((state) => state.accessToken);

  return useMutation({
    mutationFn: (input: { itemId: string; reason: string; note?: string }) => {
      if (!token) throw new Error('Sign in to report a question');
      return assessmentApi.challenge(
        input.itemId,
        { attemptId, reason: input.reason, note: input.note },
        token,
      );
    },
  });
}

export function useAssessmentBookmarksQuery(enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...asmtKeys.all, 'bookmarks', token || 'guest'] as const,
    enabled: enabled && Boolean(token),
    queryFn: () => assessmentApi.bookmarks(token as string),
    staleTime: 15_000,
  });
}

export function useRemoveBookmarkMutation() {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => {
      if (!token) throw new Error('Sign in to update a bookmark');
      return assessmentApi.unbookmark(itemId, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: [...asmtKeys.all, 'bookmarks'],
      });
    },
  });
}

export function useAssessmentWeakTopicsQuery(enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...asmtKeys.all, 'weak-topics', token || 'guest'] as const,
    enabled: enabled && Boolean(token),
    queryFn: () => assessmentApi.weakTopics(token as string),
    staleTime: 15_000,
  });
}

export function useAssessmentHistoryQuery(enabled = true) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...asmtKeys.all, 'history', token || 'guest'] as const,
    enabled: enabled && Boolean(token),
    queryFn: () => assessmentApi.history(token as string),
    staleTime: 15_000,
  });
}

export function useCourseAssessmentsQuery(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...asmtKeys.all, 'course', slug, token || 'guest'] as const,
    enabled: Boolean(slug),
    queryFn: () => assessmentApi.listForCourse(slug, token),
    staleTime: 20_000,
  });
}

export function useAssessmentLeaderboardQuery(slug: string, scope: string) {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...asmtKeys.all, 'leaderboard', slug, scope, token || 'guest'] as const,
    enabled: Boolean(token && slug),
    queryFn: () => assessmentApi.leaderboard(slug, scope, token as string),
    staleTime: 15_000,
  });
}

export function useRankingPrivacyMutation(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();

  return useMutation({
    mutationFn: (hideRanking: boolean) => {
      if (!token) throw new Error('Sign in to change ranking privacy');
      return assessmentApi.rankingPrivacy(hideRanking, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: [...asmtKeys.all, 'leaderboard', slug],
      });
    },
  });
}

function invalidateAssessmentDetail(
  client: ReturnType<typeof useQueryClient>,
  slug: string,
  session: string,
) {
  void client.invalidateQueries({
    queryKey: asmtKeys.detail(slug, session),
  });
}

export function useAssessmentCheckoutMutation(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: { couponCode?: string; instituteCode?: string }) => {
      if (!token) throw new Error('Sign in to buy this test');
      return assessmentApi.checkout(slug, input, token);
    },
    onSuccess: (result) => {
      if (result.order.status === 'paid') {
        invalidateAssessmentDetail(client, slug, session);
      }
    },
  });
}

export function useConfirmAssessmentPaymentMutation(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!token) throw new Error('Sign in to pay');
      return assessmentApi.confirmSandbox(orderId, token);
    },
    onSuccess: () => invalidateAssessmentDetail(client, slug, session),
  });
}

export function useVerifyAssessmentPaymentMutation(slug: string) {
  const token = useAuthStore((state) => state.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      if (!token) throw new Error('Sign in to pay');
      const { orderId, ...payload } = input;
      return assessmentApi.verifyRazorpay(orderId, payload, token);
    },
    onSuccess: () => invalidateAssessmentDetail(client, slug, session),
  });
}
