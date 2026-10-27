/**
 * Like / save / follow / share for a post outside the Home timeline (Saved, PostDetail).
 */

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Share } from 'react-native';

import { feedApi } from '@/features/feed/api/feed.api';
import { feedKeys } from '@/features/feed/hooks/useFeedQueries';
import { bookmarkKeys, postKeys } from '@/features/feed/hooks/usePostQueries';
import type { FeedPost } from '@/features/feed/types/feed.types';
import { profilePostKeys } from '@/features/profile/api/profile.api';
import { reelKeys } from '@/features/reels/hooks/useReelsQueries';
import { showErrorToast } from '@/shared/ui/toast';

export type PostPatcher = (postId: string, updater: (post: FeedPost) => FeedPost) => void;

/**
 * Every surface that renders a post. Call after a like / save / follow / delete settles.
 */
export function invalidatePostSurfaces(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: feedKeys.all });
  void queryClient.invalidateQueries({ queryKey: reelKeys.all });
  void queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
  void queryClient.invalidateQueries({ queryKey: postKeys.all });
  void queryClient.invalidateQueries({ queryKey: profilePostKeys.all });
}

function viewerState(post: FeedPost) {
  return {
    liked: Boolean(post.viewerState?.liked),
    bookmarked: Boolean(post.viewerState?.bookmarked),
    followingAuthor: Boolean(post.viewerState?.followingAuthor),
  };
}

/**
 * `patch` updates the caller's own cache optimistically; other surfaces refetch on settle.
 */
export function usePostCardActions(token: string | null, patch: PostPatcher) {
  const queryClient = useQueryClient();
  const refresh = () => invalidatePostSurfaces(queryClient);

  const like = useMutation({
    mutationFn: (postId: string) => feedApi.toggleLike(postId, token as string),
    onMutate: (postId) => {
      patch(postId, (post) => {
        const liked = !post.viewerState?.liked;
        return {
          ...post,
          stats: { ...post.stats, likes: Math.max(0, post.stats.likes + (liked ? 1 : -1)) },
          viewerState: { ...viewerState(post), liked },
        };
      });
    },
    onError: (error) => showErrorToast(error, 'Could not update reaction.', 'Post'),
    onSettled: refresh,
  });

  const save = useMutation({
    mutationFn: (postId: string) => feedApi.toggleBookmark(postId, token as string),
    onMutate: (postId) => {
      patch(postId, (post) => {
        const bookmarked = !post.viewerState?.bookmarked;
        return {
          ...post,
          stats: { ...post.stats, saves: Math.max(0, post.stats.saves + (bookmarked ? 1 : -1)) },
          viewerState: { ...viewerState(post), bookmarked },
        };
      });
    },
    onError: (error) => showErrorToast(error, 'Could not update bookmark.', 'Post'),
    onSettled: refresh,
  });

  const follow = useMutation({
    mutationFn: (authorId: string) => feedApi.toggleFollow(authorId, token as string),
    onError: (error) => showErrorToast(error, 'Could not update follow.', 'Post'),
    onSettled: refresh,
  });

  const share = async (postId: string) => {
    try {
      const payload = await feedApi.sharePost(postId, token as string);
      await Share.share({ message: payload.targets.copy || payload.url, url: payload.url });
    } catch (error) {
      showErrorToast(error, 'Could not share this post.', 'Post');
    }
  };

  return {
    toggleLike: (postId: string) => like.mutate(postId),
    toggleSave: (postId: string) => save.mutate(postId),
    toggleFollow: (authorId: string) => follow.mutate(authorId),
    share,
  };
}
