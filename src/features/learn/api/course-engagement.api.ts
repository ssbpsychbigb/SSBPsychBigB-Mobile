/**
 * Learner engagement — wishlist, reviews, Q&A, lesson notes.
 */

import { apiRequest } from '@/shared/api/client';
import type {
  DiscussionItem,
  LessonNoteItem,
  ReviewsPage,
  WishlistPage,
} from '@/features/learn/types/course.types';

export const courseEngagementApi = {
  wishlist(token: string) {
    return apiRequest<WishlistPage>('/courses/wishlist', { token });
  },

  addWishlist(idOrSlug: string, token: string) {
    return apiRequest<{ wishlisted: boolean }>(
      `/courses/${encodeURIComponent(idOrSlug)}/wishlist`,
      { method: 'POST', token, body: {} },
    );
  },

  removeWishlist(idOrSlug: string, token: string) {
    return apiRequest<{ wishlisted: boolean }>(
      `/courses/${encodeURIComponent(idOrSlug)}/wishlist`,
      { method: 'DELETE', token },
    );
  },

  listReviews(idOrSlug: string, token?: string | null) {
    return apiRequest<ReviewsPage>(
      `/courses/${encodeURIComponent(idOrSlug)}/reviews`,
      { token },
    );
  },

  submitReview(
    idOrSlug: string,
    input: { rating: number; body?: string; pros?: string; cons?: string },
    token: string,
  ) {
    return apiRequest<ReviewsPage>(
      `/courses/${encodeURIComponent(idOrSlug)}/reviews`,
      { method: 'POST', token, body: input },
    );
  },

  listDiscussions(idOrSlug: string, token?: string | null) {
    return apiRequest<{ items: DiscussionItem[]; isStaff?: boolean }>(
      `/courses/${encodeURIComponent(idOrSlug)}/discussions`,
      { token },
    );
  },

  postDiscussion(
    idOrSlug: string,
    input: { body: string; parentId?: string },
    token: string,
  ) {
    return apiRequest<{ items: DiscussionItem[] }>(
      `/courses/${encodeURIComponent(idOrSlug)}/discussions`,
      { method: 'POST', token, body: input },
    );
  },

  upvoteDiscussion(discussionId: string, token: string) {
    return apiRequest<{ id: string; upvotes: number; upvoted: boolean }>(
      `/courses/discussions/${encodeURIComponent(discussionId)}/upvote`,
      { method: 'POST', token, body: {} },
    );
  },

  markHelpful(discussionId: string, token: string) {
    return apiRequest<{
      id: string;
      helpfulCount: number;
      helpful: boolean;
    }>(`/courses/discussions/${encodeURIComponent(discussionId)}/helpful`, {
      method: 'POST',
      token,
      body: {},
    });
  },

  listNotes(lessonId: string, token: string) {
    return apiRequest<{ items: LessonNoteItem[] }>(
      `/courses/lessons/${encodeURIComponent(lessonId)}/notes`,
      { token },
    );
  },

  createNote(
    lessonId: string,
    input: { body: string; timestampSec?: number },
    token: string,
  ) {
    return apiRequest<LessonNoteItem>(
      `/courses/lessons/${encodeURIComponent(lessonId)}/notes`,
      { method: 'POST', token, body: input },
    );
  },

  deleteNote(noteId: string, token: string) {
    return apiRequest<{ deleted: boolean }>(
      `/courses/notes/${encodeURIComponent(noteId)}`,
      { method: 'DELETE', token },
    );
  },
};
