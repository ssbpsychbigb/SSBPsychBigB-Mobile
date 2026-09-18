/**
 * Public community feed — first tab for guests and signed-in users.
 */

import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Trash2 } from 'lucide-react-native';

import { useAppTabs } from '@/app/navigation/AppTabsContext';
import { useRootNavigate } from '@/app/navigation/useRootNavigate';

import { JoinToContinueSheet } from '@/features/auth/components/JoinToContinueSheet';
import { useOpenAuth } from '@/features/auth/hooks/useOpenAuth';
import { toMultipartFilePart } from '@/features/auth/lib/upload-asset';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { PickedAsset } from '@/features/auth/types/register-form';
import { dayBriefApi, feedApi } from '@/features/feed/api/feed.api';
import { DayBriefComposeSheet } from '@/features/feed/components/DayBriefComposeSheet';
import { DayBriefStrip } from '@/features/feed/components/DayBriefStrip';
import { DayBriefViewer } from '@/features/feed/components/DayBriefViewer';
import { FeedCommentsSheet } from '@/features/feed/components/FeedCommentsSheet';
import { FeedComposeSheet } from '@/features/feed/components/FeedComposeSheet';
import { FeedComposerCard } from '@/features/feed/components/FeedComposerCard';
import { FeedHeader } from '@/features/feed/components/FeedHeader';
import { FeedPostCard } from '@/features/feed/components/FeedPostCard';
import {
  FeedPostMenu,
  FeedReportSheet,
  type FeedPostMenuTarget,
} from '@/features/feed/components/FeedPostMenu';
import { FeedSegmentTabs } from '@/features/feed/components/FeedSegmentTabs';
import { type FeedTabKey } from '@/features/feed/data/feed-preview';
import {
  dayBriefKeys,
  feedKeys,
  useDayBriefsQuery,
  useFeedTimelineQuery,
} from '@/features/feed/hooks/useFeedQueries';
import { buildDayBriefStrip } from '@/features/feed/lib/build-day-brief-strip';
import { toFeedCardPost } from '@/features/feed/lib/to-feed-card-post';
import type { DayBriefItem, FeedPage, FeedPost } from '@/features/feed/types/feed.types';
import { ms, s, vs } from '@/shared/lib/responsive';
import { useTheme } from '@/shared/theme';
import { AppText, ConfirmModal, Screen, Spinner } from '@/shared/ui';
import { showErrorToast, showToast } from '@/shared/ui/toast';

type GateReason =
  | 'react'
  | 'comment'
  | 'save'
  | 'follow'
  | 'compose'
  | 'story'
  | 'share'
  | 'moderate';

const GATE_COPY: Record<GateReason, { title: string; message: string }> = {
  react: {
    title: 'React to posts',
    message: 'Join BIGB to support officers, educators, and fellow aspirants.',
  },
  comment: {
    title: 'Join the discussion',
    message: 'Comments are for members. Create an account to add your take.',
  },
  save: {
    title: 'Save for later',
    message: 'Bookmarks stay in your library after you join.',
  },
  follow: {
    title: 'Build your prep circle',
    message: 'Follow officers and mentors once you are signed in.',
  },
  compose: {
    title: 'Share with the community',
    message: 'Public posts and briefs need a BIGB account.',
  },
  story: {
    title: 'Share a story',
    message: '24-hour stories are for members. Reels are a separate tab.',
  },
  share: {
    title: 'Share this post',
    message: 'Outbound share unlocks after you join so we can count it fairly.',
  },
  moderate: {
    title: 'Manage this post',
    message: 'Report, pin, and delete are for members.',
  },
};

function appendImagePart(formData: FormData, asset: PickedAsset): void {
  formData.append('media', toMultipartFilePart(asset, 'media') as unknown as Blob);
}

function patchPostInPages(
  pages: FeedPage[] | undefined,
  postId: string,
  updater: (post: FeedPost) => FeedPost,
): FeedPage[] | undefined {
  if (!pages) {
    return pages;
  }
  return pages.map((page) => ({
    ...page,
    items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
  }));
}

/**
 * Instagram + LinkedIn hybrid feed. Live `/feed/*` and `/posts/*` APIs.
 */
export function FeedScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthed = Boolean(accessToken);
  const sessionKey = accessToken || 'guest';
  const openRegister = useOpenAuth('Register');
  const goRoot = useRootNavigate();
  const { jumpTo, requestReelCompose } = useAppTabs();

  const openMemberProfile = (username?: string, name?: string) => {
    if (!username?.trim()) {
      showToast.error('Profile unavailable', 'This member has no public username yet.');
      return;
    }
    goRoot('MemberProfile', { username: username.trim(), name });
  };

  const [tab, setTab] = useState<FeedTabKey>('forYou');
  const [gate, setGate] = useState<GateReason | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [briefComposeOpen, setBriefComposeOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [activeBrief, setActiveBrief] = useState<DayBriefItem | null>(null);
  const [menuTarget, setMenuTarget] = useState<FeedPostMenuTarget | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const timelineEnabled = tab !== 'following' || isAuthed;
  const timelineQuery = useFeedTimelineQuery(tab, accessToken, timelineEnabled);
  const briefsQuery = useDayBriefsQuery(accessToken);

  const posts = useMemo(() => {
    const items = timelineQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return items.map((post) => ({
      api: post,
      card: {
        ...toFeedCardPost(post),
        isOwn: Boolean(user?.id && post.authorId === user.id),
      },
    }));
  }, [timelineQuery.data, user?.id]);

  const briefTiles = useMemo(
    () =>
      buildDayBriefStrip({
        liveItems: briefsQuery.data?.items || [],
        viewerId: user?.id,
      }),
    [briefsQuery.data?.items, user?.id],
  );

  const requireMember = (reason: GateReason, authedFallback?: () => void) => {
    if (!isAuthed || !accessToken) {
      setGate(reason);
      return;
    }
    authedFallback?.();
  };

  const invalidateFeed = () => {
    void queryClient.invalidateQueries({ queryKey: feedKeys.all });
  };

  const likeMutation = useMutation({
    mutationFn: (postId: string) => feedApi.toggleLike(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.timeline(tab, sessionKey),
      });
      queryClient.setQueryData(
        feedKeys.timeline(tab, sessionKey),
        (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: patchPostInPages(current.pages, postId, (post) => {
              const liked = !post.viewerState?.liked;
              return {
                ...post,
                stats: {
                  ...post.stats,
                  likes: Math.max(0, post.stats.likes + (liked ? 1 : -1)),
                },
                viewerState: {
                  liked,
                  bookmarked: Boolean(post.viewerState?.bookmarked),
                  followingAuthor: Boolean(post.viewerState?.followingAuthor),
                },
              };
            }),
          };
        },
      );
    },
    onError: (error) => {
      invalidateFeed();
      showErrorToast(error, 'Could not update reaction.', 'Feed');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (postId: string) =>
      feedApi.toggleBookmark(postId, accessToken as string),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({
        queryKey: feedKeys.timeline(tab, sessionKey),
      });
      queryClient.setQueryData(
        feedKeys.timeline(tab, sessionKey),
        (current: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!current) {
            return current;
          }
          return {
            ...current,
            pages: patchPostInPages(current.pages, postId, (post) => ({
              ...post,
              viewerState: {
                liked: Boolean(post.viewerState?.liked),
                bookmarked: !post.viewerState?.bookmarked,
                followingAuthor: Boolean(post.viewerState?.followingAuthor),
              },
            })),
          };
        },
      );
    },
    onError: (error) => {
      invalidateFeed();
      showErrorToast(error, 'Could not update bookmark.', 'Feed');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (input: { postId: string; reason: string }) =>
      feedApi.reportPost(input.postId, { reason: input.reason }, accessToken as string),
    onSuccess: () => {
      setReportPostId(null);
      showToast.success('Reported', 'Thanks — moderators will review this post.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not send this report.', 'Feed');
    },
  });

  const pinMutation = useMutation({
    mutationFn: (postId: string) => feedApi.togglePin(postId, accessToken as string),
    onSuccess: (result) => {
      setMenuTarget(null);
      invalidateFeed();
      showToast.success(result.pinned ? 'Pinned to profile' : 'Unpinned');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update pin.', 'Feed');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => feedApi.deletePost(postId, accessToken as string),
    onSuccess: () => {
      setDeletePostId(null);
      setMenuTarget(null);
      invalidateFeed();
      showToast.success('Post deleted');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not delete this post.', 'Feed');
    },
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) =>
      feedApi.toggleFollow(userId, accessToken as string),
    onSuccess: () => {
      invalidateFeed();
    },
    onError: (error) => {
      showErrorToast(error, 'Could not update follow.', 'Feed');
    },
  });

  const composeMutation = useMutation({
    mutationFn: async (input: { content: string; image?: PickedAsset }) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      let media: Array<{ url: string; thumbnail?: string; mediaType?: string }> | undefined;
      if (input.image) {
        const formData = new FormData();
        appendImagePart(formData, input.image);
        const uploaded = await feedApi.uploadMedia(formData, accessToken);
        media = uploaded.media;
      }
      return feedApi.createPost(
        {
          content: input.content,
          type: media?.length ? 'image' : 'text',
          visibility: 'public',
          categories: ['motivation'],
          media,
        },
        accessToken,
      );
    },
    onSuccess: () => {
      setComposeOpen(false);
      invalidateFeed();
      showToast.success('Posted', 'Your post is live on the feed.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not publish this post.', 'Feed');
    },
  });

  const briefMutation = useMutation({
    mutationFn: async (input: { caption: string; image: PickedAsset }) => {
      if (!accessToken) {
        throw new Error('Not signed in');
      }
      const formData = new FormData();
      appendImagePart(formData, input.image);
      const uploaded = await dayBriefApi.uploadMedia(formData, accessToken);
      return dayBriefApi.create(accessToken, {
        caption: input.caption,
        mediaUrl: uploaded.url,
        mediaType: uploaded.mediaType,
        thumbnailUrl: uploaded.thumbnail,
        durationSec: uploaded.mediaType === 'video' ? 12 : 6,
      });
    },
    onSuccess: () => {
      setBriefComposeOpen(false);
      void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
      showToast.success('Story shared', 'Visible on Home for 24 hours. Not a Reel.');
    },
    onError: (error) => {
      showErrorToast(error, 'Could not share this brief.', 'Day Brief');
    },
  });

  const canvas =
    theme.mode === 'dark' ? theme.colors.background : theme.palette.primary[50];

  const refreshing = timelineQuery.isRefetching || briefsQuery.isRefetching;

  return (
    <>
      <Screen
        contentStyle={styles.shell}
        padded={false}
        safeBottom={false}
        style={{ backgroundColor: canvas }}>
        <View style={styles.pad}>
          <FeedHeader
            hasUnreadMessages={isAuthed}
            isAuthed={isAuthed}
            onOpenMessages={() => goRoot('Messages')}
            onOpenNotifications={() => goRoot('Notifications')}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          nestedScrollEnabled
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void timelineQuery.refetch();
                void briefsQuery.refetch();
              }}
              refreshing={refreshing}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.flex}>
          <DayBriefStrip
            briefs={briefTiles}
            isAuthed={isAuthed}
            onBriefPress={(tile) => {
              const live = briefsQuery.data?.items.find((item) => item.id === tile.id);
              if (!live) {
                return;
              }
              setActiveBrief(live);
              if (accessToken) {
                void dayBriefApi.markViewed(accessToken, live.id).then(() => {
                  void queryClient.invalidateQueries({ queryKey: dayBriefKeys.all });
                });
              }
            }}
            onSelfPress={() => requireMember('story', () => setBriefComposeOpen(true))}
          />

          <View style={styles.composerBlock}>
            <FeedComposerCard
              displayName={user?.fullName}
              isAuthed={isAuthed}
              onAction={(kind) => {
                if (kind === 'ai' && isAuthed) {
                  showToast.info('AI Mentor', 'Ask-AI compose wires in with the AI module.');
                  return;
                }
                if (kind === 'video') {
                  requireMember('compose', () => {
                    requestReelCompose();
                    jumpTo('reels');
                  });
                  return;
                }
                requireMember('compose', () => setComposeOpen(true));
              }}
            />
          </View>

          <View style={styles.tabs}>
            <FeedSegmentTabs
              active={tab}
              onChange={(next) => {
                if (next === 'following' && !isAuthed) {
                  setGate('follow');
                  return;
                }
                setTab(next);
              }}
            />
          </View>

          <View style={styles.pad}>
            {timelineQuery.isPending ? <Spinner /> : null}

            {timelineQuery.isError ? (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">Could not load the feed</AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  Pull to refresh, or retry once your API is reachable.
                </AppText>
                <Pressable onPress={() => void timelineQuery.refetch()}>
                  <AppText color="brand" variant="caption" weight="semibold">
                    Retry
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {tab === 'following' &&
            isAuthed &&
            !timelineQuery.isPending &&
            !timelineQuery.isError &&
            posts.length === 0 ? (
              <EmptyFollowing />
            ) : null}

            {tab !== 'following' &&
            !timelineQuery.isPending &&
            !timelineQuery.isError &&
            posts.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">No posts yet</AppText>
                <AppText color="secondary" style={styles.emptyCopy} variant="caption">
                  Be the first to share a useful note with the community.
                </AppText>
              </View>
            ) : null}

            {posts.map((entry, index) => (
              <Animated.View
                entering={FadeInDown.delay(80 + index * 40).duration(400)}
                key={entry.card.id}
                style={styles.cardWrap}>
                <FeedPostCard
                  liked={Boolean(entry.api.viewerState?.liked)}
                  onAuthorPress={() =>
                    openMemberProfile(
                      entry.card.author.username || entry.api.author?.username,
                      entry.card.author.name,
                    )
                  }
                  onComment={() => setCommentPostId(entry.api.id)}
                  onFollow={() =>
                    requireMember('follow', () => {
                      const authorId = entry.api.author?.id || entry.api.authorId;
                      followMutation.mutate(authorId);
                    })
                  }
                  onMenu={() =>
                    requireMember('moderate', () => {
                      setMenuTarget({
                        id: entry.api.id,
                        isOwn: Boolean(entry.card.isOwn),
                        pinned: Boolean(entry.api.pinnedAt),
                      });
                    })
                  }
                  onReact={() =>
                    requireMember('react', () => likeMutation.mutate(entry.api.id))
                  }
                  onSave={() =>
                    requireMember('save', () => saveMutation.mutate(entry.api.id))
                  }
                  onShare={() =>
                    requireMember('share', () => {
                      void (async () => {
                        try {
                          const payload = await feedApi.sharePost(
                            entry.api.id,
                            accessToken as string,
                          );
                          await Share.share({
                            message: payload.targets.copy || payload.url,
                            url: payload.url,
                          });
                        } catch (error) {
                          showErrorToast(error, 'Could not share this post.', 'Feed');
                        }
                      })();
                    })
                  }
                  post={entry.card}
                  saved={Boolean(entry.api.viewerState?.bookmarked)}
                />
              </Animated.View>
            ))}

            {timelineQuery.hasNextPage ? (
              <Pressable
                onPress={() => void timelineQuery.fetchNextPage()}
                style={styles.more}>
                <AppText color="brand" variant="caption" weight="semibold">
                  {timelineQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                </AppText>
              </Pressable>
            ) : null}

            {!isAuthed ? (
              <Pressable
                accessibilityRole="button"
                onPress={openRegister}
                style={[
                  styles.banner,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <AppText variant="label">You’re browsing as a guest</AppText>
                <AppText color="secondary" style={styles.bannerCopy} variant="caption">
                  Join to follow officers, save posts, and share your own briefs.
                </AppText>
                <AppText color="brand" variant="caption" weight="semibold">
                  Create a free account
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </Screen>

      <JoinToContinueSheet
        message={gate ? GATE_COPY[gate].message : ''}
        onClose={() => setGate(null)}
        title={gate ? GATE_COPY[gate].title : ''}
        visible={Boolean(gate)}
      />

      <FeedComposeSheet
        busy={composeMutation.isPending}
        onClose={() => setComposeOpen(false)}
        onSubmit={(input) => composeMutation.mutate(input)}
        visible={composeOpen}
      />

      <DayBriefComposeSheet
        busy={briefMutation.isPending}
        onClose={() => setBriefComposeOpen(false)}
        onSubmit={(input) => briefMutation.mutate(input)}
        visible={briefComposeOpen}
      />

      <FeedCommentsSheet
        onAdded={invalidateFeed}
        onAuthorPress={(username, name) => openMemberProfile(username, name)}
        onClose={() => setCommentPostId(null)}
        postId={commentPostId}
        token={accessToken}
        visible={Boolean(commentPostId)}
      />

      <FeedPostMenu
        busy={pinMutation.isPending}
        onClose={() => setMenuTarget(null)}
        onSelect={(key) => {
          if (!menuTarget) {
            return;
          }
          if (key === 'pin') {
            pinMutation.mutate(menuTarget.id);
            return;
          }
          if (key === 'delete') {
            setMenuTarget(null);
            setDeletePostId(menuTarget.id);
            return;
          }
          setMenuTarget(null);
          setReportPostId(menuTarget.id);
        }}
        target={menuTarget}
      />
      <FeedReportSheet
        busy={reportMutation.isPending}
        onClose={() => setReportPostId(null)}
        onSubmit={(reason) => {
          if (reportPostId) {
            reportMutation.mutate({ postId: reportPostId, reason });
          }
        }}
        visible={Boolean(reportPostId)}
      />
      <ConfirmModal
        Icon={Trash2}
        confirmLabel="Delete"
        isLoading={deletePostMutation.isPending}
        message="This removes the post from the feed. You can recover it from trash on web if needed."
        onCancel={() => setDeletePostId(null)}
        onConfirm={() => {
          if (deletePostId) {
            deletePostMutation.mutate(deletePostId);
          }
        }}
        title="Delete this post?"
        tone="danger"
        visible={Boolean(deletePostId)}
      />
      <DayBriefViewer
        brief={activeBrief}
        onAuthorPress={(username, name) => openMemberProfile(username, name)}
        onClose={() => setActiveBrief(null)}
      />
    </>
  );
}

function EmptyFollowing() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.empty,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}>
      <Users color={theme.colors.primary} size={ms(22)} />
      <AppText variant="label">Follow people to fill this tab</AppText>
      <AppText color="secondary" style={styles.emptyCopy} variant="caption">
        Start with officers and educators from For You.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: vs(28),
  },
  pad: {
    paddingHorizontal: s(16),
  },
  composerBlock: {
    paddingHorizontal: s(16),
    marginTop: vs(6),
    marginBottom: vs(16),
    zIndex: 0,
    elevation: 0,
  },
  tabs: {
    zIndex: 1,
    marginBottom: vs(14),
  },
  cardWrap: {
    marginBottom: vs(12),
  },
  banner: {
    borderWidth: 1,
    borderRadius: ms(18),
    padding: ms(16),
    gap: ms(6),
    marginTop: vs(4),
    marginBottom: vs(8),
  },
  bannerCopy: {
    marginBottom: vs(4),
  },
  empty: {
    borderWidth: 1,
    borderRadius: ms(18),
    padding: ms(18),
    alignItems: 'center',
    gap: ms(6),
    marginBottom: vs(12),
  },
  emptyCopy: {
    textAlign: 'center',
  },
  more: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
});
