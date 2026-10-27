/**
 * Published posts on a profile — same cards as Home, opened from You and from a member.
 */

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';

import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import { usePostCardActions } from '@/features/feed/hooks/usePostCardActions';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { FeedPage, FeedPost } from '@/features/feed/types/feed.types';
import { profileApi, profilePostKeys } from '@/features/profile/api/profile.api';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Spinner } from '@/shared/ui';
import { showToast } from '@/shared/ui/toast';

export type ProfilePostsSectionProps = {
  username: string;
  /** Signed-out taps on like, save, or follow. */
  onNeedJoin?: () => void;
};

export function ProfilePostsSection({ username, onNeedJoin }: ProfilePostsSectionProps) {
  const theme = useTheme();
  const goRoot = useRootNavigate();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.accessToken);
  const viewerId = useAuthStore((state) => state.user?.id);
  const viewerName = useAuthStore((state) => state.user?.username);
  const isSelf = Boolean(viewerName && viewerName === username);
  const session = token || 'guest';

  const postsQuery = useInfiniteQuery({
    queryKey: profilePostKeys.list(username, session),
    enabled: Boolean(username),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => profileApi.getPosts(username, token, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
  });

  const items = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [postsQuery.data],
  );

  const patch = (postId: string, updater: (post: FeedPost) => FeedPost) => {
    queryClient.setQueryData<{ pages: FeedPage[]; pageParams: unknown[] }>(
      profilePostKeys.list(username, session),
      (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
          })),
        };
      },
    );
  };
  const actions = usePostCardActions(token, patch);

  const guard = (run: () => void) => {
    if (!token) {
      if (onNeedJoin) {
        onNeedJoin();
      } else {
        showToast.info('Sign in', 'Join BIGB to react, save, and follow.');
      }
      return;
    }
    run();
  };

  const openPost = (postId: string, openComments?: boolean) => {
    goRoot('PostDetail', { postId, openComments });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <AppText variant="subtitle" weight="bold">
          Posts
        </AppText>
        <AppText color="muted" variant="caption">
          {isSelf ? 'What you have shared on BIGB' : 'Public posts and reels'}
        </AppText>
      </View>

      {postsQuery.isPending ? <Spinner size="small" /> : null}

      {postsQuery.isError ? (
        <View style={[styles.empty, { borderColor: theme.colors.border }]}>
          <AppText variant="label" weight="semibold">
            Could not load posts
          </AppText>
          <Button fullWidth onPress={() => void postsQuery.refetch()} variant="secondary">
            Try again
          </Button>
        </View>
      ) : null}

      {!postsQuery.isPending && !postsQuery.isError && items.length === 0 ? (
        <View style={[styles.empty, { borderColor: theme.colors.border }]}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryMuted }]}>
            <FileText color={theme.colors.primary} size={ms(22)} strokeWidth={1.8} />
          </View>
          <AppText variant="label" weight="semibold">
            {isSelf ? 'No posts yet' : 'No public posts yet'}
          </AppText>
          <AppText color="muted" style={styles.center} variant="caption">
            {isSelf
              ? 'Share something from Home and it will show up here.'
              : 'When this member posts, it will show up here.'}
          </AppText>
        </View>
      ) : null}

      {items.map((post) => (
        <FeedPostCard
          key={post.id}
          liked={Boolean(post.viewerState?.liked)}
          onAuthorPress={() => {
            if (post.author?.username && post.author.username !== username) {
              goRoot('MemberProfile', {
                username: post.author.username,
                name: post.author.fullName,
              });
            }
          }}
          onComment={() => openPost(post.id, true)}
          onFollow={() => guard(() => actions.toggleFollow(post.author?.id || post.authorId))}
          onMenu={() => openPost(post.id)}
          onOpen={() => openPost(post.id)}
          onReact={() => guard(() => actions.toggleLike(post.id))}
          onSave={() => guard(() => actions.toggleSave(post.id))}
          onShare={() => guard(() => void actions.share(post.id))}
          post={{ ...toFeedCardPost(post), isOwn: Boolean(viewerId && post.authorId === viewerId) }}
          saved={Boolean(post.viewerState?.bookmarked)}
        />
      ))}

      {postsQuery.hasNextPage ? (
        <Button
          fullWidth
          loading={postsQuery.isFetchingNextPage}
          onPress={() => void postsQuery.fetchNextPage()}
          variant="secondary">
          Show more
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: vs(12),
  },
  head: {
    gap: vs(2),
  },
  empty: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: ms(16),
    paddingHorizontal: s(16),
    paddingVertical: vs(18),
    alignItems: 'center',
    gap: vs(8),
  },
  icon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
