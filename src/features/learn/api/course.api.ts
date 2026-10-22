/**
 * Learner + payment course APIs. Never call `/courses/studio/*` from mobile.
 */

import { apiRequest } from '@/shared/api/client';
import type {
  CheckoutResult,
  CouponPreview,
  CourseDetails,
  CourseListFilters,
  CourseListPage,
  CourseOrder,
  EnrollmentSummary,
  LessonDetails,
  LessonProgress,
  MyLearningPage,
  PaidUnlockResult,
  PaymentStatus,
  SaveProgressInput,
} from '@/features/learn/types/course.types';

export const courseApi = {
  list(
    params: CourseListFilters & {
      cursor?: string | null;
      limit?: number;
      token?: string | null;
    },
  ) {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.examGoal && params.examGoal !== 'all') {
      search.set('examGoal', params.examGoal);
    }
    if (params.price && params.price !== 'all') {
      search.set('price', params.price);
    }
    if (params.difficulty && params.difficulty !== 'all') {
      search.set('difficulty', params.difficulty);
    }
    if (params.sort) search.set('sort', params.sort);
    if (params.cursor) search.set('cursor', params.cursor);
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return apiRequest<CourseListPage>(`/courses${qs ? `?${qs}` : ''}`, {
      token: params.token,
    });
  },

  getByIdOrSlug(idOrSlug: string, token?: string | null) {
    return apiRequest<CourseDetails>(
      `/courses/${encodeURIComponent(idOrSlug)}`,
      { token },
    );
  },

  myLearning(token: string, limit = 30) {
    return apiRequest<MyLearningPage>(
      `/courses/my-learning?limit=${limit}`,
      { token },
    );
  },

  enroll(idOrSlug: string, token: string) {
    return apiRequest<{
      enrollment: EnrollmentSummary;
      course: CourseDetails;
      created: boolean;
    }>(`/courses/${encodeURIComponent(idOrSlug)}/enroll`, {
      method: 'POST',
      token,
      body: {},
    });
  },

  checkout(
    idOrSlug: string,
    input: { couponCode?: string; instituteCode?: string },
    token: string,
  ) {
    return apiRequest<CheckoutResult>(
      `/courses/${encodeURIComponent(idOrSlug)}/checkout`,
      {
        method: 'POST',
        token,
        body: input,
      },
    );
  },

  getOrder(orderId: string, token: string) {
    return apiRequest<CourseOrder>(
      `/payments/orders/${encodeURIComponent(orderId)}`,
      { token },
    );
  },

  confirmSandboxPayment(orderId: string, token: string) {
    return apiRequest<PaidUnlockResult>(
      `/payments/orders/${encodeURIComponent(orderId)}/sandbox-confirm`,
      {
        method: 'POST',
        token,
        body: {},
      },
    );
  },

  verifyRazorpayPayment(
    orderId: string,
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    token: string,
  ) {
    return apiRequest<PaidUnlockResult>(
      `/payments/orders/${encodeURIComponent(orderId)}/razorpay/verify`,
      {
        method: 'POST',
        token,
        body: payload,
      },
    );
  },

  paymentStatus(token?: string | null) {
    return apiRequest<PaymentStatus>('/payments/status', { token });
  },

  previewCoupon(price: number, couponCode: string, token: string) {
    return apiRequest<CouponPreview>('/payments/coupons/preview', {
      method: 'POST',
      token,
      body: { price, couponCode },
    });
  },

  getLesson(lessonId: string, token?: string | null) {
    return apiRequest<LessonDetails>(
      `/courses/lessons/${encodeURIComponent(lessonId)}`,
      { token },
    );
  },

  saveProgress(lessonId: string, input: SaveProgressInput, token: string) {
    return apiRequest<{
      progress: LessonProgress;
      enrollment: EnrollmentSummary;
    }>(`/courses/lessons/${encodeURIComponent(lessonId)}/progress`, {
      method: 'POST',
      token,
      body: input,
    });
  },

  submitQuiz(
    lessonId: string,
    input: { answers: number[]; timeSpentSec?: number },
    token: string,
  ) {
    return apiRequest<{
      progress: LessonProgress;
      enrollment: EnrollmentSummary;
      result: {
        correct: number;
        total: number;
        scorePct: number;
        passed: boolean;
        attemptCount: number;
        remainingAttempts: number;
      };
    }>(`/courses/lessons/${encodeURIComponent(lessonId)}/quiz`, {
      method: 'POST',
      token,
      body: input,
    });
  },
};
