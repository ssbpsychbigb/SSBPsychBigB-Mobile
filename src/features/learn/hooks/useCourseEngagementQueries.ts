/**
 * Wishlist, reviews, Q&A, and lesson notes.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { courseEngagementApi } from '@/features/learn/api/course-engagement.api';
import { courseKeys } from '@/features/learn/hooks/useCourseQueries';
import type { LessonNoteItem } from '@/features/learn/types/course.types';

export function useWishlistQuery(enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.wishlist(token || 'guest'),
    enabled: enabled && Boolean(token),
    queryFn: () => courseEngagementApi.wishlist(token as string),
    staleTime: 15_000,
  });
}

export function useToggleWishlistMutation(idOrSlug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: async (currentlyWishlisted: boolean) => {
      if (!token) {
        throw new Error('Sign in to save courses');
      }
      return currentlyWishlisted
        ? courseEngagementApi.removeWishlist(idOrSlug, token)
        : courseEngagementApi.addWishlist(idOrSlug, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.wishlist(session) });
      void client.invalidateQueries({ queryKey: courseKeys.all });
    },
  });
}

export function useCourseReviewsQuery(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.reviews(slug),
    enabled: Boolean(slug),
    queryFn: () => courseEngagementApi.listReviews(slug, token),
    staleTime: 20_000,
  });
}

export function useSubmitReviewMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const session = token || 'guest';

  return useMutation({
    mutationFn: (input: {
      rating: number;
      body?: string;
      pros?: string;
      cons?: string;
    }) => {
      if (!token) {
        throw new Error('Sign in to review');
      }
      return courseEngagementApi.submitReview(slug, input, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.reviews(slug) });
      void client.invalidateQueries({
        queryKey: courseKeys.detail(slug, session),
      });
    },
  });
}

export function useCourseDiscussionsQuery(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.discussions(slug),
    enabled: Boolean(slug),
    queryFn: () => courseEngagementApi.listDiscussions(slug, token),
    staleTime: 15_000,
  });
}

export function usePostDiscussionMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) => {
      if (!token) {
        throw new Error('Sign in to ask a question');
      }
      return courseEngagementApi.postDiscussion(slug, input, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.discussions(slug) });
    },
  });
}

export function useUpvoteDiscussionMutation(slug: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();

  return useMutation({
    mutationFn: (discussionId: string) => {
      if (!token) {
        throw new Error('Sign in to upvote');
      }
      return courseEngagementApi.upvoteDiscussion(discussionId, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.discussions(slug) });
    },
  });
}

export function useLessonNotesQuery(lessonId: string, enabled = true) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: courseKeys.notes(lessonId),
    enabled: enabled && Boolean(token) && Boolean(lessonId),
    queryFn: () => courseEngagementApi.listNotes(lessonId, token as string),
    staleTime: 10_000,
  });
}

export function useCreateLessonNoteMutation(lessonId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const key = courseKeys.notes(lessonId);

  return useMutation({
    mutationFn: (input: { body: string; timestampSec?: number }) => {
      if (!token) {
        throw new Error('Sign in to save notes');
      }
      return courseEngagementApi.createNote(lessonId, input, token);
    },
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<{ items: LessonNoteItem[] }>(key);
      const optimistic: LessonNoteItem = {
        id: `local-${Date.now()}`,
        body: input.body,
        timestampSec: Math.max(0, Math.floor(input.timestampSec || 0)),
        createdAt: new Date().toISOString(),
        lessonId,
      };
      client.setQueryData<{ items: LessonNoteItem[] }>(key, {
        items: [optimistic, ...(previous?.items || [])],
      });
      return { previous };
    },
    onError: (_error, _input, ctx) => {
      if (ctx?.previous) {
        client.setQueryData(key, ctx.previous);
      }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteLessonNoteMutation(lessonId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => {
      if (!token) {
        throw new Error('Sign in to delete notes');
      }
      return courseEngagementApi.deleteNote(noteId, token);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: courseKeys.notes(lessonId) });
    },
  });
}
