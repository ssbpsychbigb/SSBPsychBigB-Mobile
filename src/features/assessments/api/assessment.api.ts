/**
 * Learner assessment API. Studio routes stay on the web.
 * Paid tests use the shared payment checkout (`productType: "assessment"`).
 */

import { apiRequest } from '@/shared/api/client';
import type {
  AssessmentCard,
  AssessmentHistory,
  AssessmentListResult,
  AssessmentCheckoutResult,
  AssessmentPaidResult,
  AttemptAnswer,
  AttemptState,
  BookmarkList,
  CourseAssessmentList,
  LeaderboardResult,
  WeakTopicsResult,
} from '@/features/assessments/types/assessment.types';

export const assessmentApi = {
  list(params: {
    q?: string;
    kind?: string;
    examGoal?: string;
    token?: string | null;
  }) {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.kind && params.kind !== 'all') search.set('kind', params.kind);
    if (params.examGoal && params.examGoal !== 'all') {
      search.set('examGoal', params.examGoal);
    }
    const qs = search.toString();
    return apiRequest<AssessmentListResult>(
      `/assessments${qs ? `?${qs}` : ''}`,
      { token: params.token },
    );
  },

  get(idOrSlug: string, token?: string | null) {
    return apiRequest<AssessmentCard>(
      `/assessments/${encodeURIComponent(idOrSlug)}`,
      { token },
    );
  },

  listForCourse(idOrSlug: string, token?: string | null) {
    return apiRequest<CourseAssessmentList>(
      `/assessments/course/${encodeURIComponent(idOrSlug)}`,
      { token },
    );
  },

  history(token: string) {
    return apiRequest<AssessmentHistory>('/assessments/me/history', { token });
  },

  weakTopics(token: string) {
    return apiRequest<WeakTopicsResult>('/assessments/me/weak-topics', {
      token,
    });
  },

  rankingPrivacy(hideRanking: boolean, token: string) {
    return apiRequest<{ hideRanking: boolean }>(
      '/assessments/me/ranking-privacy',
      { method: 'PATCH', token, body: { hideRanking } },
    );
  },

  leaderboard(idOrSlug: string, scope: string, token: string) {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return apiRequest<LeaderboardResult>(
      `/assessments/${encodeURIComponent(idOrSlug)}/leaderboard${qs}`,
      { token },
    );
  },

  start(idOrSlug: string, token: string) {
    return apiRequest<AttemptState>(
      `/assessments/${encodeURIComponent(idOrSlug)}/start`,
      { method: 'POST', token },
    );
  },

  save(attemptId: string, answers: AttemptAnswer[], token: string) {
    return apiRequest<AttemptState>(
      `/assessments/attempts/${encodeURIComponent(attemptId)}/save`,
      { method: 'POST', token, body: { answers } },
    );
  },

  submit(attemptId: string, answers: AttemptAnswer[], token: string) {
    return apiRequest<AttemptState>(
      `/assessments/attempts/${encodeURIComponent(attemptId)}/submit`,
      { method: 'POST', token, body: { answers } },
    );
  },

  getAttempt(attemptId: string, token: string) {
    return apiRequest<AttemptState>(
      `/assessments/attempts/${encodeURIComponent(attemptId)}`,
      { token },
    );
  },

  recordEvent(
    attemptId: string,
    body: { type: string; itemId?: string },
    token: string,
  ) {
    return apiRequest<{ ok: boolean; tabLeaveCount: number }>(
      `/assessments/attempts/${encodeURIComponent(attemptId)}/event`,
      { method: 'POST', token, body },
    );
  },

  bookmarks(token: string, folder?: string) {
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    return apiRequest<BookmarkList>(`/assessments/me/bookmarks${qs}`, {
      token,
    });
  },

  bookmark(
    itemId: string,
    body: { folder: string; attemptId: string },
    token: string,
  ) {
    return apiRequest<{ bookmarked: boolean; folder: string; itemId: string }>(
      `/assessments/items/${encodeURIComponent(itemId)}/bookmark`,
      { method: 'POST', token, body },
    );
  },

  unbookmark(itemId: string, token: string) {
    return apiRequest<{ bookmarked: boolean; itemId: string }>(
      `/assessments/items/${encodeURIComponent(itemId)}/bookmark`,
      { method: 'DELETE', token },
    );
  },

  challenge(
    itemId: string,
    body: { attemptId: string; reason: string; note?: string },
    token: string,
  ) {
    return apiRequest<{ id: string; reported: boolean; reason: string }>(
      `/assessments/items/${encodeURIComponent(itemId)}/report`,
      { method: 'POST', token, body },
    );
  },

  checkout(
    idOrSlug: string,
    input: { couponCode?: string; instituteCode?: string },
    token: string,
  ) {
    return apiRequest<AssessmentCheckoutResult>('/payments/checkout', {
      method: 'POST',
      token,
      body: { productType: 'assessment', idOrSlug, ...input },
    });
  },

  confirmSandbox(orderId: string, token: string) {
    return apiRequest<AssessmentPaidResult>(
      `/payments/orders/${encodeURIComponent(orderId)}/sandbox-confirm`,
      { method: 'POST', token, body: {} },
    );
  },

  verifyRazorpay(
    orderId: string,
    payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
    token: string,
  ) {
    return apiRequest<AssessmentPaidResult>(
      `/payments/orders/${encodeURIComponent(orderId)}/razorpay/verify`,
      { method: 'POST', token, body: payload },
    );
  },
};
