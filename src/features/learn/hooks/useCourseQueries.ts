/**
 * React Query keys and learner course fetches.
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { courseApi } from '@/features/learn/api/course.api';
import type {
  CourseListFilters,
  SaveProgressInput,
} from '@/features/learn/types/course.types';

export const courseKeys = {
  all: ['courses'] as const,
  explore: (filters: CourseListFilters, session: string) =>
    [...courseKeys.all, 'explore', filters, session] as const,
  mine: (session: string) => [...courseKeys.all, 'mine', session] as const,
  wishlist: (session: string) =>
    [...courseKeys.all, 'wishlist', session] as const,
  detail: (slug: string, session: string) =>
    [...courseKeys.all, 'detail', slug, session] as const,
  lesson: (lessonId: string, session: string) =>
    [...courseKeys.all, 'lesson', lessonId, session] as const,
  reviews: (slug: string) => [...courseKeys.all, 'reviews', slug] as const,
  discussions: (slug: string) =>
    [...courseKeys.all, 'discussions', slug] as const,
  notes: (lessonId: string) => [...courseKeys.all, 'notes', lessonId] as const,
};

export function useCourseCatalogueQuery(filters: CourseListFilters) {
  const token = useAuthStore((s) => s.accessToken);
  const session = token || 'guest';
  return useInfiniteQuery({
    queryKey: courseKeys.explore(filters, session),
    enabled: true,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      courseApi.list({
        ...filters,
        cursor: pageParam,
        limit: 12,
        token,
      }),
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor : undefined),
    staleTime: 20_000,
  });
}

export function useMyLearningQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.mine(token || 'guest'),
    enabled: enabled && Boolean(token),
    queryFn: () => courseApi.myLearning(token as string),
    staleTime: 15_000,
  });
}

export function useCourseDetailQuery(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.detail(slug, token || 'guest'),
    enabled: Boolean(slug),
    queryFn: () => courseApi.getByIdOrSlug(slug, token),
    staleTime: 20_000,
  });
}

export function useLessonQuery(lessonId: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.lesson(lessonId, token || 'guest'),
    enabled: enabled && Boolean(lessonId),
    queryFn: () => courseApi.getLesson(lessonId, token),
    staleTime: 10_000,
  });
}

export function useEnrollCourseMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Sign in to enroll');
      }
      return courseApi.enroll(slug, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.mine(session) });
      void client.invalidateQueries({
        queryKey: courseKeys.detail(slug, session),
      });
    },
  });
}

export function useSaveLessonProgressMutation(lessonId: string, slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: SaveProgressInput) => {
      if (!token) {
        throw new Error('Sign in to save progress');
      }
      return courseApi.saveProgress(lessonId, input, token);
    },
    onSuccess: (_data, input) => {
      if (!input.completed) {
        return;
      }
      void client.invalidateQueries({
        queryKey: courseKeys.lesson(lessonId, session),
      });
      void client.invalidateQueries({ queryKey: courseKeys.mine(session) });
      void client.invalidateQueries({
        queryKey: courseKeys.detail(slug, session),
      });
    },
  });
}

function invalidateAfterPurchase(
  client: ReturnType<typeof useQueryClient>,
  slug: string,
  session: string,
) {
  void client.invalidateQueries({ queryKey: courseKeys.mine(session) });
  void client.invalidateQueries({
    queryKey: courseKeys.detail(slug, session),
  });
}

export function usePaymentStatusQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: [...courseKeys.all, 'payments', 'status'] as const,
    enabled,
    queryFn: () => courseApi.paymentStatus(token),
    staleTime: 60_000,
  });
}

export function useCouponPreviewQuery(
  price: number,
  couponCode: string,
  enabled = true,
) {
  const token = useAuthStore((s) => s.accessToken);
  const code = couponCode.trim().toUpperCase();
  return useQuery({
    queryKey: [...courseKeys.all, 'coupon', price, code] as const,
    enabled: enabled && Boolean(token) && code.length >= 4 && price > 0,
    queryFn: () => courseApi.previewCoupon(price, code, token as string),
    staleTime: 30_000,
  });
}

export function useCreateCheckoutMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: { couponCode?: string; instituteCode?: string }) => {
      if (!token) {
        throw new Error('Sign in to checkout');
      }
      return courseApi.checkout(slug, input, token);
    },
    onSuccess: (result) => {
      if (result.order.status === 'paid') {
        invalidateAfterPurchase(client, slug, session);
      }
    },
  });
}

export function useConfirmSandboxPaymentMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (orderId: string) => {
      if (!token) {
        throw new Error('Sign in to pay');
      }
      return courseApi.confirmSandboxPayment(orderId, token);
    },
    onSuccess: () => invalidateAfterPurchase(client, slug, session),
  });
}

export function useVerifyRazorpayPaymentMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      if (!token) {
        throw new Error('Sign in to pay');
      }
      return courseApi.verifyRazorpayPayment(input.orderId, input, token);
    },
    onSuccess: () => invalidateAfterPurchase(client, slug, session),
  });
}

export function useSubmitLessonQuizMutation(lessonId: string, slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: { answers: number[]; timeSpentSec?: number }) => {
      if (!token) {
        throw new Error('Sign in to take this quiz');
      }
      return courseApi.submitQuiz(lessonId, input, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: courseKeys.lesson(lessonId, session),
      });
      void client.invalidateQueries({ queryKey: courseKeys.mine(session) });
      void client.invalidateQueries({
        queryKey: courseKeys.detail(slug, session),
      });
    },
  });
}
