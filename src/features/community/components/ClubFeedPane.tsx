/**
 * Club feed / Q&A — list in the page scroll; sheets sit beside Screen like Home feed.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Pin, Trash2 } from 'lucide-react-native';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { getUserInitials } from '@/features/home/lib/user-initials';
import { feedApi } from '@/features/feed/api/feed.api';
import { FeedCommentsSheet } from '@/features/feed/components/FeedCommentsSheet';
import { FeedComposeSheet } from '@/features/feed/components/FeedComposeSheet';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import {
  useClubPostModerateMutation,
  useCommunityFeedQuery,
} from '@/features/community/hooks/useCommunityQueries';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { Community } from '@/features/community/types/community.types';
import type { FeedPost } from '@/features/feed/types/feed.types';
import { ChatThreadMenu } from '@/features/message/components/ChatSafetySheet';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

export type ClubFeedPaneProps = {
  community: Community;
  canPreview: boolean;
  canAct: boolean;
  mode: 'all' | 'question';
  onNeedJoin: () => void;
};

type FeedEntry = {
  api: FeedPost;
  card: ReturnType<typeof toFeedCardPost>;
};

function appendImagePart(formData: FormData, asset: PickedAsset): void {
  formData.append('media', toMultipartFilePart(asset, 'media') as unknown as Blob);
}

type SessionValue = {
  props: ClubFeedPaneProps;
  token: string | null;
  displayName: string | undefined;
  selfId: string | undefined;
  posts: FeedEntry[];
  loading: boolean;
  hasNextPage: boolean;
  fetchNext: () => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  commentPostId: string | null;
  setCommentPostId: (id: string | null) => void;
  menuPostId: string | null;
  setMenuPostId: (id: string | null) => void;
  removePostId: string | null;
  setRemovePostId: (id: string | null) => void;
  menuPost: FeedEntry['api'] | undefined;
  composeBusy: boolean;
  onCompose: (input: { content: string; image?: PickedAsset }) => void;
  onLike: (postId: string) => void;
  onRefetch: () => void;
  moderateBusy: boolean;
  onPin: (postId: string, pinned: boolean) => void;
  onRemove: (postId: string) => void;
};

const ClubFeedContext = createContext<SessionValue | null>(null);

function useClubFeedSession(): SessionValue {
  const value = useContext(ClubFeedContext);
  if (!value) {
    throw new Error('Club feed must wrap ClubFeedProvider');
  }
  return value;
}

/**
 * Owns feed queries and overlay state so sheets are not trapped inside ScrollView.
 */
export function ClubFeedProvider({
  children,
  ...props
}: ClubFeedPaneProps & { children: ReactNode }) {
  const { community, canPreview, canAct, mode, onNeedJoin } = props;
  const token = useAuthStore((state) => state.accessToken);
  const displayName = useAuthStore((state) => state.user?.fullName);
  const selfId = useAuthStore((state) => state.user?.id);
  const feedQuery = useCommunityFeedQuery(community.slug, canPreview, mode);
  const moderate = useClubPostModerateMutation(community.slug);
  const [composeOpen, setComposeOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [removePostId, setRemovePostId] = useState<string | null>(null);

  const posts = useMemo<FeedEntry[]>(() => {
    const items = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((item) => ({
      api: item,
      card: {
        ...toFeedCardPost(item),
        isOwn: item.authorId === selfId,
      },
    }));
  }, [feedQuery.data, selfId]);

  const menuPost = posts.find((entry) => entry.api.id === menuPostId)?.api;

  const composeMutation = useMutation({
    mutationFn: async (input: { content: string; image?: PickedAsset }) => {
      if (!token) {
        throw new Error('Not signed in');
      }
      let media: Array<{ url: string; thumbnail?: string; mediaType?: string }> | undefined;
      if (input.image) {
        const formData = new FormData();
        appendImagePart(formData, input.image);
        const uploaded = await feedApi.uploadMedia(formData, token);
        media = uploaded.media;
      }
      return feedApi.createPost(
        {
          content: input.content,
          type: mode === 'question' ? 'question' : media?.length ? 'image' : 'text',
          visibility: 'public',
          categories: ['motivation'],
          communityId: community.id,
          media,
        },
        token,
      );
    },
    onSuccess: () => {
      setComposeOpen(false);
      void feedQuery.refetch();
      showToast.success(mode === 'question' ? 'Question posted' : 'Posted to club');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not publish.', 'Community');
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => feedApi.toggleLike(postId, token as string),
    onSuccess: () => {
      void feedQuery.refetch();
    },
    onError: (error) => {
      showErrorToast(error, 'Could not react.', 'Community');
    },
  });

  const value: SessionValue = {
    props,
    token,
    displayName,
    selfId,
    posts,
    loading: Boolean(feedQuery.isLoading && !feedQuery.data),
    hasNextPage: Boolean(feedQuery.hasNextPage),
    fetchNext: () => {
      void feedQuery.fetchNextPage();
    },
    composeOpen,
    setComposeOpen,
    commentPostId,
    setCommentPostId,
    menuPostId,
    setMenuPostId,
    removePostId,
    setRemovePostId,
    menuPost,
    composeBusy: composeMutation.isPending,
    onCompose: (input) => composeMutation.mutate(input),
    onLike: (postId) => {
      if (!canAct || !token) {
        onNeedJoin();
        return;
      }
      likeMutation.mutate(postId);
    },
    onRefetch: () => {
      void feedQuery.refetch();
    },
    moderateBusy: moderate.isPending,
    onPin: (postId, pinned) => {
      moderate.mutate(
        { postId, action: pinned ? 'unpin' : 'pin' },
        {
          onSuccess: () => showToast.success(pinned ? 'Unpinned' : 'Pinned in club'),
          onError: (error) => showErrorToast(error, 'Could not update pin.', 'Community'),
        },
      );
    },
    onRemove: (postId) => {
      moderate.mutate(
        { postId, action: 'remove' },
        {
          onSuccess: () => {
            setRemovePostId(null);
            showToast.success('Removed from club');
          },
          onError: (error) =>
            showErrorToast(error, 'Could not remove this post.', 'Community'),
        },
      );
    },
  };

  return <ClubFeedContext.Provider value={value}>{children}</ClubFeedContext.Provider>;
}

/**
 * Public preview can read. Likes and new comments need an approved member.
 */
export function ClubFeedPane() {
  const theme = useTheme();
  const {
    props: { community, canPreview, canAct, mode, onNeedJoin },
    displayName,
    posts,
    loading,
    hasNextPage,
    fetchNext,
    setComposeOpen,
    setCommentPostId,
    setMenuPostId,
    onLike,
  } = useClubFeedSession();
  const initials = getUserInitials(displayName);

  if (!canPreview) {
    return (
      <View style={styles.lock}>
        <AppText variant="label" weight="bold">
          Private club
        </AppText>
        <AppText color="muted" variant="caption">
          Request to join. Feed stays locked until an admin approves you.
        </AppText>
      </View>
    );
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <View style={styles.stack}>
      {canAct ? (
        <Pressable
          onPress={() => setComposeOpen(true)}
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}>
          <View
            style={[
              styles.composerAvatar,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderColor: theme.colors.primary,
              },
            ]}>
            <AppText color="brand" variant="caption" weight="semibold">
              {initials}
            </AppText>
          </View>
          <View
            style={[
              styles.composerField,
              {
                backgroundColor:
                  theme.mode === 'dark'
                    ? theme.colors.primaryMuted
                    : theme.palette.primary[50],
                borderColor: theme.colors.border,
              },
            ]}>
            <AppText color="muted" numberOfLines={1} variant="body">
              {mode === 'question' ? 'Ask the room…' : 'Share with this club…'}
            </AppText>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onNeedJoin}
          style={[
            styles.previewNote,
            { backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.border },
          ]}>
          <AppText color="secondary" variant="caption">
            You can read this club. Request to join to post, like, or comment.
          </AppText>
        </Pressable>
      )}

      {posts.length === 0 ? (
        <AppText color="muted" style={styles.empty} variant="caption">
          {mode === 'question' ? 'No questions yet.' : 'No posts in this club yet.'}
        </AppText>
      ) : null}

      {posts.map((entry) => (
        <FeedPostCard
          key={entry.api.id}
          liked={Boolean(entry.api.viewerState?.liked)}
          onComment={() => setCommentPostId(entry.api.id)}
          onFollow={() => undefined}
          onMenu={() => {
            if (community.canModerate) {
              setMenuPostId(entry.api.id);
            }
          }}
          onReact={() => onLike(entry.api.id)}
          onSave={() => {
            if (!canAct) {
              onNeedJoin();
            }
          }}
          onShare={() => {
            void Share.share({ message: entry.card.body || entry.card.author.name });
          }}
          post={entry.card}
          saved={Boolean(entry.api.viewerState?.bookmarked)}
        />
      ))}

      {hasNextPage ? (
        <Pressable onPress={fetchNext} style={styles.more}>
          <AppText color="brand" variant="caption" weight="semibold">
            Load more
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Compose / comments / moderate — siblings of the page ScrollView.
 */
export function ClubFeedOverlays() {
  const {
    props: { mode },
    token,
    composeOpen,
    setComposeOpen,
    commentPostId,
    setCommentPostId,
    menuPost,
    setMenuPostId,
    menuPostId,
    removePostId,
    setRemovePostId,
    composeBusy,
    onCompose,
    onRefetch,
    moderateBusy,
    onPin,
    onRemove,
  } = useClubFeedSession();

  return (
    <>
      <FeedComposeSheet
        busy={composeBusy}
        heading={mode === 'question' ? 'Ask the club' : 'Post in club'}
        onClose={() => setComposeOpen(false)}
        onSubmit={onCompose}
        placeholder={
          mode === 'question'
            ? 'A clear question helps the room answer well.'
            : 'Write for this club — not the global feed.'
        }
        visible={composeOpen}
      />
      <FeedCommentsSheet
        onAdded={onRefetch}
        onClose={() => setCommentPostId(null)}
        postId={commentPostId}
        token={token}
        visible={Boolean(commentPostId)}
      />
      <ChatThreadMenu
        busy={moderateBusy}
        items={
          menuPost
            ? [
                {
                  key: 'pin',
                  label: menuPost.pinnedAt ? 'Unpin from club' : 'Pin to club',
                  Icon: Pin,
                },
                {
                  key: 'remove',
                  label: 'Remove from club',
                  Icon: Trash2,
                  tone: 'danger',
                  separatorBefore: true,
                },
              ]
            : []
        }
        onClose={() => setMenuPostId(null)}
        onSelect={(key) => {
          const postId = menuPostId;
          const pinned = Boolean(menuPost?.pinnedAt);
          setMenuPostId(null);
          if (!postId) {
            return;
          }
          if (key === 'remove') {
            setRemovePostId(postId);
            return;
          }
          onPin(postId, pinned);
        }}
        visible={Boolean(menuPost)}
      />
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Remove"
        isLoading={moderateBusy}
        message="Members will no longer see this post in the club."
        onCancel={() => setRemovePostId(null)}
        onConfirm={() => {
          if (removePostId) {
            onRemove(removePostId);
          }
        }}
        title="Remove this post?"
        tone="danger"
        visible={Boolean(removePostId)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: vs(12),
    paddingTop: vs(12),
  },
  lock: {
    paddingTop: vs(16),
    gap: vs(6),
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderWidth: 1,
    borderRadius: ms(18),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  composerAvatar: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerField: {
    flex: 1,
    height: ms(40),
    borderRadius: ms(20),
    borderWidth: 1,
    paddingHorizontal: s(14),
    justifyContent: 'center',
  },
  previewNote: {
    borderWidth: 1,
    borderRadius: ms(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
  empty: {
    paddingVertical: vs(8),
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(6),
  },
});
