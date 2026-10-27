/**
 * Single post — opened from Notifications, Saved, and profile links (`/posts/:postId`).
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileX, Trash2 } from 'lucide-react-native';

import type { RootStackParamList } from '@/app/navigation/types';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';
import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedCommentsSheet } from '@/features/feed/components/FeedCommentsSheet';
import { EditPostSheet, type EditPostTarget } from '@/features/feed/components/EditPostSheet';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import {
  FeedPostMenu,
  FeedReportSheet,
  type FeedPostMenuTarget,
} from '@/features/feed/components/FeedPostMenu';
import { FeedPostVideo, postVideoUri } from '@/features/feed/components/FeedPostVideo';
import {
  invalidatePostSurfaces,
  usePostCardActions,
} from '@/features/feed/hooks/usePostCardActions';
import { postKeys, usePostQuery } from '@/features/feed/hooks/usePostQueries';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { FeedPost } from '@/features/feed/types/feed.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import {
  AppText,
  Button,
  ConfirmModal,
  SocialStackChrome,
  Spinner,
  usePullToRefresh,
} from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export function PostDetailScreen({ route, navigation }: Props) {
  const { postId, openComments } = route.params;
  const theme = useTheme();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const goRoot = useRootNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const session = accessToken || 'guest';

  const postQuery = usePostQuery(postId, accessToken);
  const post = postQuery.data;

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<FeedPostMenuTarget | null>(null);
  const [editTarget, setEditTarget] = useState<EditPostTarget | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (openComments && post) {
      setCommentsOpen(true);
    }
  }, [openComments, post]);

  const patch = (id: string, updater: (current: FeedPost) => FeedPost) => {
    queryClient.setQueryData<FeedPost>(postKeys.detail(id, session), (current) =>
      current ? updater(current) : current,
    );
  };
  const actions = usePostCardActions(accessToken, patch);

  const requireMember = (run: () => void) => {
    if (!accessToken) {
      setJoinOpen(true);
      return;
    }
    run();
  };

  const pinMutation = useMutation({
    mutationFn: () => feedApi.togglePin(postId, accessToken as string),
    onSuccess: (result) => {
      setMenuTarget(null);
      invalidatePostSurfaces(queryClient);
      showToast.success(result.pinned ? 'Pinned to profile' : 'Unpinned');
    },
    onError: (error) => showErrorToast(error, 'Could not update pin.', 'Post'),
  });

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      feedApi.reportPost(postId, { reason }, accessToken as string),
    onSuccess: () => {
      setReportOpen(false);
      showToast.success('Reported', 'Thanks — moderators will review this post.');
    },
    onError: (error) => showErrorToast(error, 'Could not send this report.', 'Post'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => feedApi.deletePost(postId, accessToken as string),
    onSuccess: () => {
      setDeleteOpen(false);
      invalidatePostSurfaces(queryClient);
      showToast.success('Post deleted');
      navigation.goBack();
    },
    onError: (error) => showErrorToast(error, 'Could not delete this post.', 'Post'),
  });

  const openProfile = (username?: string, name?: string) => {
    if (!username?.trim()) {
      showToast.error('Profile unavailable', 'This member has no public username yet.');
      return;
    }
    goRoot('MemberProfile', { username: username.trim(), name });
  };

  const refreshControl = usePullToRefresh(() => postQuery.refetch());
  const isOwn = Boolean(post && user?.id && post.authorId === user.id);
  const hasVideo = Boolean(post && postVideoUri(post));

  return (
    <>
      <SocialStackChrome
        refreshControl={refreshControl}
        subtitle={post?.author?.fullName ? `by ${post.author.fullName}` : undefined}
        title={hasVideo ? 'Reel' : 'Post'}>
        {postQuery.isPending ? <Spinner /> : null}

        {postQuery.isError ? (
          <View
            style={[
              styles.state,
              { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
            ]}>
            <View style={[styles.stateIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <FileX color={theme.colors.primary} size={ms(26)} />
            </View>
            <AppText style={styles.center} variant="subtitle" weight="bold">
              This post is not available
            </AppText>
            <AppText color="secondary" style={styles.center} variant="body">
              It may have been deleted, or it is only visible to the author’s followers.
            </AppText>
            <Button fullWidth onPress={() => void postQuery.refetch()} variant="secondary">
              Try again
            </Button>
          </View>
        ) : null}

        {post ? (
          <FeedPostCard
            liked={Boolean(post.viewerState?.liked)}
            mediaSlot={
              hasVideo ? (
                <FeedPostVideo mode="player" paused={!isFocused || commentsOpen} post={post} />
              ) : undefined
            }
            onAuthorPress={() => openProfile(post.author?.username, post.author?.fullName)}
            onComment={() => setCommentsOpen(true)}
            onFollow={() =>
              requireMember(() => actions.toggleFollow(post.author?.id || post.authorId))
            }
            onMenu={() =>
              requireMember(() =>
                setMenuTarget({ id: post.id, isOwn, pinned: Boolean(post.pinnedAt) }),
              )
            }
            onReact={() => requireMember(() => actions.toggleLike(post.id))}
            onSave={() => requireMember(() => actions.toggleSave(post.id))}
            onShare={() => requireMember(() => void actions.share(post.id))}
            post={{ ...toFeedCardPost(post), isOwn }}
            saved={Boolean(post.viewerState?.bookmarked)}
          />
        ) : null}
      </SocialStackChrome>

      <FeedCommentsSheet
        onAdded={() => invalidatePostSurfaces(queryClient)}
        onAuthorPress={(username, name) => {
          setCommentsOpen(false);
          openProfile(username, name);
        }}
        onClose={() => setCommentsOpen(false)}
        postId={commentsOpen ? postId : null}
        token={accessToken}
        visible={commentsOpen}
      />

      <EditPostSheet
        onClose={() => setEditTarget(null)}
        target={editTarget}
        token={accessToken}
      />
      <FeedPostMenu
        busy={pinMutation.isPending}
        onClose={() => setMenuTarget(null)}
        onSelect={(key) => {
          if (key === 'edit') {
            setMenuTarget(null);
            setEditTarget({ id: postId, content: post?.content || '' });
            return;
          }
          if (key === 'pin') {
            pinMutation.mutate();
            return;
          }
          setMenuTarget(null);
          if (key === 'delete') {
            setDeleteOpen(true);
            return;
          }
          setReportOpen(true);
        }}
        target={menuTarget}
      />
      <FeedReportSheet
        busy={reportMutation.isPending}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason) => reportMutation.mutate(reason)}
        visible={reportOpen}
      />
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        message="This removes the post from the feed and your profile."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete this post?"
        tone="danger"
        visible={deleteOpen}
      />
      <JoinToContinueSheet
        message="Join BIGB to react, save, follow, and comment on posts."
        onClose={() => setJoinOpen(false)}
        title="Join the community"
        visible={joinOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  state: {
    borderWidth: 1,
    borderRadius: ms(20),
    padding: ms(20),
    alignItems: 'center',
    gap: vs(10),
    marginTop: vs(8),
  },
  stateIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
    paddingHorizontal: s(4),
  },
});
