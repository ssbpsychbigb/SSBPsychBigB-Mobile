/**
 * Saved post drafts — `/posts/drafts` list plus save / delete.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedApi } from '@/features/feed/api/feed.api';
import {
  resolveComposeMedia,
  type ComposeMediaItem,
} from '@/features/feed/lib/upload-post-image';

export const draftKeys = {
  all: ['post-drafts'] as const,
  list: (session: string) => [...draftKeys.all, 'list', session] as const,
};

export type SaveDraftInput = {
  content: string;
  media: ComposeMediaItem[];
  draftId?: string | null;
};

export function usePostDrafts(token: string | null | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  const draftsQuery = useQuery({
    queryKey: draftKeys.list(token || 'guest'),
    queryFn: () => feedApi.listDrafts(token as string),
    enabled: Boolean(token) && enabled,
    staleTime: 15_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: draftKeys.all });

  const saveDraft = useMutation({
    mutationFn: async (input: SaveDraftInput) => {
      if (!token) {
        throw new Error('Not signed in');
      }
      const media = await resolveComposeMedia(input.media, token);
      if (input.draftId) {
        return feedApi.updatePost(input.draftId, { content: input.content, media }, token);
      }
      return feedApi.createPost(
        {
          content: input.content,
          visibility: 'public',
          categories: ['motivation'],
          media,
          status: 'draft',
        },
        token,
      );
    },
    onSuccess: invalidate,
  });

  const deleteDraft = useMutation({
    mutationFn: (draftId: string) => feedApi.deletePost(draftId, token as string),
    onSuccess: invalidate,
  });

  return { draftsQuery, saveDraft, deleteDraft };
}
